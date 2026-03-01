/**
 * YouTube MP3/MP4 API Server
 * Tương tự cấu trúc ZingMP3 proxy
 * Tham khảo: 
 * - https://github.com/MichaelBelgium/Youtube-API
 * - https://github.com/MatheusIshiyama/youtube-download-api
 * - https://github.com/Dalero/YouTube-MP3-API-iFrame
 * - https://github.com/awesome-yasin/Media-Downloader
 * - https://github.com/coolguruji/youtube-to-mp3-api
 */

const express = require('express');
const cors = require('cors');
// Sử dụng @distube/ytdl-core thay vì ytdl-core (version mới hơn, ổn định hơn)
let ytdl;
try {
    ytdl = require('@distube/ytdl-core');
} catch (e) {
    // Fallback về ytdl-core nếu @distube/ytdl-core không có
    ytdl = require('ytdl-core');
}

const youtubeSr = require('youtube-sr');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile, spawn } = require('child_process');
const https = require('https');
const http = require('http');

// Handle youtube-sr import (có thể là default export hoặc named export)
const search = youtubeSr.default?.search || youtubeSr.search || youtubeSr;

const app = express();
const PORT = process.env.PORT || 6680;
const YTDLP_PATH = process.env.YTDLP_PATH || 'yt-dlp';
const FFMPEG_PATH = process.env.FFMPEG_PATH || 'ffmpeg';

// Log startup info và test imports
console.log(`[YouTube API] Starting server on port ${PORT}...`);
console.log(`[YouTube API] Node version: ${process.version}`);
console.log(`[YouTube API] Environment: ${process.env.NODE_ENV || 'development'}`);

// Test critical imports
try {
    console.log(`[YouTube API] Testing imports...`);
    if (!express) throw new Error('express not loaded');
    if (!cors) throw new Error('cors not loaded');
    if (!ytdl) throw new Error('ytdl-core not loaded');
    if (!youtubeSr) throw new Error('youtube-sr not loaded');
    console.log(`[YouTube API] All imports OK`);
} catch (error) {
    console.error(`[YouTube API] Import error:`, error.message);
    console.error(`[YouTube API] Please run: npm install`);
    process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (test UI, docs, etc.)
const PUBLIC_DIR = path.join(__dirname, 'public');
if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}
app.use(express.static(PUBLIC_DIR));

// Metrics - tương tự ZingMP3 proxy
const metrics = {
    startTime: Date.now(),
    totalRequests: 0,
    perEndpoint: {},
    lastRequestAt: null,
    errors: 0,
    downloads: {
        mp3: 0,
        mp4: 0
    }
};

app.use((req, res, next) => {
    metrics.totalRequests += 1;
    metrics.lastRequestAt = Date.now();
    const key = `${req.method} ${req.path}`;
    metrics.perEndpoint[key] = (metrics.perEndpoint[key] || 0) + 1;
    next();
});

function recordError() {
    metrics.errors += 1;
}

// Cache directory
const CACHE_DIR = path.join(__dirname, 'cache');
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Helper: Extract video ID from YouTube URL
function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }
    
    return null;
}

// Helper: Validate YouTube URL
function isValidYouTubeUrl(url) {
    return ytdl.validateURL(url) || /^[a-zA-Z0-9_-]{11}$/.test(url);
}

// Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'YouTube MP3/MP4 API',
        uptime: Math.round((Date.now() - metrics.startTime) / 1000)
    });
});

// Get video info
app.get('/api/info', async (req, res) => {
    const { url, id } = req.query;
    
    if (!url && !id) {
        recordError();
        return res.status(400).json({
            success: false,
            error: 'Missing parameter: url or id'
        });
    }
    
    try {
        const videoId = id || extractVideoId(url);
        
        if (!videoId) {
            recordError();
            return res.status(400).json({
                success: false,
                error: 'Invalid YouTube URL or ID'
            });
        }
        
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        // Get video info
        const info = await ytdl.getInfo(videoUrl);
        
        res.json({
            success: true,
            data: {
                id: videoId,
                title: info.videoDetails.title,
                description: info.videoDetails.description,
                thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]?.url,
                duration: parseInt(info.videoDetails.lengthSeconds),
                durationFormatted: formatDuration(parseInt(info.videoDetails.lengthSeconds)),
                author: info.videoDetails.author.name,
                viewCount: info.videoDetails.viewCount,
                uploadDate: info.videoDetails.publishDate,
                formats: info.formats.map(f => ({
                    itag: f.itag,
                    quality: f.qualityLabel || f.quality,
                    mimeType: f.mimeType,
                    hasVideo: f.hasVideo,
                    hasAudio: f.hasAudio,
                    container: f.container
                }))
            }
        });
    } catch (error) {
        recordError();
        console.error('[YouTube API] Info error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Download MP3
app.get('/api/mp3', async (req, res) => {
    const { url, id, quality = 'highestaudio' } = req.query;
    
    if (!url && !id) {
        recordError();
        return res.status(400).json({
            success: false,
            error: 'Missing parameter: url or id'
        });
    }
    
    try {
        const videoId = id || extractVideoId(url);
        
        if (!videoId) {
            recordError();
            return res.status(400).json({
                success: false,
                error: 'Invalid YouTube URL or ID'
            });
        }
        
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        // Get video info
        const info = await ytdl.getInfo(videoUrl);
        const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 100);
        
        // Set headers for download
        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
        res.setHeader('Content-Type', 'audio/mpeg');
        
        // Stream audio
        const audioStream = ytdl(videoUrl, {
            quality: quality,
            filter: 'audioonly'
        });
        
        metrics.downloads.mp3 += 1;
        
        audioStream.pipe(res);
        
        audioStream.on('error', (error) => {
            recordError();
            console.error('[YouTube API] MP3 stream error:', error.message);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
    } catch (error) {
        recordError();
        console.error('[YouTube API] MP3 error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Download MP4
app.get('/api/mp4', async (req, res) => {
    const { url, id, quality = 'highest' } = req.query;
    
    if (!url && !id) {
        recordError();
        return res.status(400).json({
            success: false,
            error: 'Missing parameter: url or id'
        });
    }
    
    try {
        const videoId = id || extractVideoId(url);
        
        if (!videoId) {
            recordError();
            return res.status(400).json({
                success: false,
                error: 'Invalid YouTube URL or ID'
            });
        }
        
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        // Get video info
        const info = await ytdl.getInfo(videoUrl);
        const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 100);
        
        // Set headers for download
        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');
        
        // Stream video
        const videoStream = ytdl(videoUrl, {
            quality: quality
        });
        
        metrics.downloads.mp4 += 1;
        
        videoStream.pipe(res);
        
        videoStream.on('error', (error) => {
            recordError();
            console.error('[YouTube API] MP4 stream error:', error.message);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
    } catch (error) {
        recordError();
        console.error('[YouTube API] MP4 error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Stream MP3 - Trả về direct URL hoặc stream trực tiếp
// Tương tự youtube.kytuoi.com/api/stream/mp3?id=...
app.get('/api/stream/mp3', async (req, res) => {
    const { url, id, quality = 'highestaudio', format, bitrate } = req.query;
    
    if (!url && !id) {
        recordError();
        return res.status(400).json({
            success: false,
            error: 'Missing parameter: url or id'
        });
    }
    
    try {
        const videoId = id || extractVideoId(url);
        
        if (!videoId) {
            recordError();
            return res.status(400).json({
                success: false,
                error: 'Invalid YouTube URL or ID'
            });
        }
        
        // ĐƠN GIẢN NHẤT: Chỉ lấy direct URL và proxy stream (không cần metadata, không convert)
        let directUrl;
        const startTime = Date.now();
        try {
            console.log(`[YouTube API] Starting to get direct URL for ${videoId}...`);
            directUrl = await getYtDlpDirectUrl(videoId);
            const elapsed = Date.now() - startTime;
            console.log(`[YouTube API] Got direct URL for ${videoId} in ${elapsed}ms`);
        } catch (error) {
            const elapsed = Date.now() - startTime;
            recordError();
            console.error(`[YouTube API] Failed to get direct URL for ${videoId} after ${elapsed}ms:`, error.message);
            return res.status(500).json({
                success: false,
                error: `Failed to get audio URL: ${error.message}`
            });
        }
        
        // Xử lý format parameter:
        // - format=url: trả về JSON với direct URL (URL trực tiếp từ YouTube)
        // - format=stream: proxy stream qua server (luồng phát từ server, không phải trực tiếp từ YouTube)
        // - format=mp3: convert sang MP3 (cần ffmpeg, stream từ server)
        // - Không có format: proxy stream qua server (tương tự format=stream)
        if (format === 'url') {
            res.json({
                success: true,
                id: videoId,
                url: directUrl,
                audio_url: directUrl,
                source: 'youtube (yt-dlp)'
            });
            console.log(`[YouTube API] Returned direct URL for: ${videoId}`);
        } else if (format === 'mp3') {
            // format=mp3: convert sang MP3 với bitrate (dùng ffmpeg đọc trực tiếp từ YouTube directUrl)
            if (req.method === 'OPTIONS') {
                return res.status(200).end();
            }
            
            const targetBitrate = bitrate ? parseInt(bitrate) : 128;
            const bitrateK = Math.max(64, Math.min(320, targetBitrate));
            
            try {
                await streamMp3FromDirectUrl(directUrl, videoId, req, res, bitrateK);
                console.log(`[YouTube API] Streaming MP3 (${bitrateK}kbps) for ${videoId} via directUrl`);
            } catch (mp3Error) {
                recordError();
                console.error(`[YouTube API] MP3 conversion failed:`, mp3Error.message);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        error: `MP3 conversion failed: ${mp3Error.message}`
                    });
                } else {
                    res.end();
                }
            }
        } else if (format === 'stream' || format === 'proxy' || !format) {
            // format=stream, format=proxy hoặc không có format: PROXY STREAM QUA SERVER
            // Luồng phát từ server (server proxy từ YouTube), KHÔNG phải trực tiếp từ YouTube
            // Detect MIME type từ URL: M4A = audio/mp4, WebM = audio/webm
            // CHỈ TRẢ VỀ M4A (AAC) - KHÔNG CÒN WebM
            // getYtDlpDirectUrl() đã đảm bảo chỉ trả về M4A, nên không cần check lại
            const mimeType = 'audio/mp4'; // CHỈ M4A (AAC)
            const formatName = 'M4A (AAC)';
            console.log(`[YouTube API] Proxying audio stream via SERVER for: ${videoId} (format: ${formatName}, Content-Type: ${mimeType})`);
            console.log(`[YouTube API] NOTE: Stream is proxied through server, NOT direct from YouTube`);
            console.log(`[YouTube API] NOTE: Only M4A (AAC) format is served, NO WebM/Opus`);
            await proxyExternalAudio(directUrl, req, res, mimeType);
        } else {
            // Format không hợp lệ
            return res.status(400).json({
                success: false,
                error: `Invalid format parameter: ${format}. Valid formats: url, stream, mp3`
            });
        }
        
    } catch (error) {
        recordError();
        console.error('[YouTube API] Stream MP3 error:', error.message);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
});

// Stream PCM/MP3 by song name (tương tự youtube.kytuoi.com) - cho Robot/AI
// Trả về JSON response với đầy đủ thông tin như ZingMP3 proxy
app.get('/stream_pcm', async (req, res) => {
    const { song, artist } = req.query;
    
    if (!song) {
        recordError();
        return res.status(400).json({
            success: false,
            error: 'Missing parameter: song'
        });
    }
    
    try {
        // Tạo query string từ song và artist
        let query = song;
        if (artist) {
            query = `${song} ${artist}`;
        }
        
        console.log(`[YouTube API] Stream PCM request: song="${song}", artist="${artist || 'N/A'}", query="${query}"`);
        
        // Search YouTube
        let results;
        if (typeof search === 'function') {
            results = await search(query, {
                limit: 5,
                type: 'video'
            });
        } else if (youtubeSr.default && typeof youtubeSr.default.search === 'function') {
            results = await youtubeSr.default.search(query, {
                limit: 5,
                type: 'video'
            });
        } else if (typeof youtubeSr.search === 'function') {
            results = await youtubeSr.search(query, {
                limit: 5,
                type: 'video'
            });
        } else {
            throw new Error('youtube-sr search function not available');
        }
        
        if (!results || results.length === 0) {
            recordError();
            return res.status(404).json({
                success: false,
                error: `No results found for: ${query}`
            });
        }
        
        // Lấy video đầu tiên
        const firstVideo = results[0];
        const videoId = firstVideo.id;
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        console.log(`[YouTube API] Found video: ${firstVideo.title} (${videoId})`);
        
        // Get video info để lấy thêm metadata
        let videoInfo;
        try {
            videoInfo = await ytdl.getInfo(videoUrl);
        } catch (infoError) {
            console.warn(`[YouTube API] Could not get video info: ${infoError.message}`);
            videoInfo = null;
        }
        
        // Extract artist từ title hoặc channel name
        let extractedArtist = artist || '';
        if (!extractedArtist) {
            // Thử extract từ title (format: "Song Name - Artist Name")
            const titleParts = firstVideo.title.split(' - ');
            if (titleParts.length > 1) {
                extractedArtist = titleParts[titleParts.length - 1].trim();
            } else if (firstVideo.channel?.name) {
                extractedArtist = firstVideo.channel.name;
            }
        }
        
        // Extract song title (bỏ artist nếu có trong title)
        let extractedTitle = firstVideo.title;
        if (extractedArtist && extractedTitle.includes(' - ')) {
            const parts = extractedTitle.split(' - ');
            if (parts.length > 1 && parts[parts.length - 1].trim() === extractedArtist) {
                extractedTitle = parts.slice(0, -1).join(' - ').trim();
            }
        }
        
        // Check if video has captions (lyrics)
        let hasLyrics = false;
        if (videoInfo) {
            const captionTracks = videoInfo?.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
            if (captionTracks && captionTracks.length > 0) {
                hasLyrics = true;
            }
        }
        
        // Build response tương tự ZingMP3 proxy structure
        // Tương thích 100% với ESP32/AI parsing (theo ESP32_RESPONSE_FIELDS.md)
        // audio_url/url: dùng luồng MP3 (convert bằng ffmpeg) để dễ tương thích thiết bị/ứng dụng
        // lyric_url: luôn trả để ESP32 thử fetch (server sẽ tự tìm captions)
        const response = {
            success: true,
            id: videoId,
            title: extractedTitle || firstVideo.title,
            artist: extractedArtist || firstVideo.channel?.name || 'Unknown Artist',
            // Sử dụng luồng MP3 (convert từ M4A bằng ffmpeg) cho audio_url/url
            // Client sẽ gọi: GET /api/stream/mp3?id=VIDEO_ID&format=mp3
            audio_url: `/api/stream/mp3?id=${videoId}&format=mp3`,
            url: `/api/stream/mp3?id=${videoId}&format=mp3`,
            lyric_url: `/api/lyric?id=${videoId}&format=lrc`, // Luôn trả lyric_url, endpoint sẽ tự xử lý
            thumbnail: firstVideo.thumbnail?.url || (videoInfo?.videoDetails?.thumbnails?.[videoInfo.videoDetails.thumbnails.length - 1]?.url) || '',
            duration: videoInfo ? parseInt(videoInfo.videoDetails.lengthSeconds) : (firstVideo.duration || 0),
            bitrate: '128kbps', // AAC/Opus bitrate (tùy format được chọn)
            source: 'youtube' // Để phân biệt với zingmp3
        };
        
        // Log response
        console.log(`[YouTube API] Stream PCM response: ${response.title} - ${response.artist} (${videoId})`);
        
        // Return JSON response (không stream trực tiếp)
        res.json(response);
        
    } catch (error) {
        recordError();
        console.error('[YouTube API] Stream PCM error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================================
// LRCLIB.net - Free synced lyrics database
// Provides high-quality, human-transcribed synced lyrics
// ============================================================
async function fetchLrclibLyrics(songTitle, artistName, durationSec) {
    return new Promise((resolve, reject) => {
        // Build search URL
        let searchUrl;
        if (songTitle && artistName) {
            const params = new URLSearchParams({
                track_name: songTitle,
                artist_name: artistName
            });
            if (durationSec && durationSec > 0) {
                params.set('duration', durationSec.toString());
            }
            searchUrl = `https://lrclib.net/api/get?${params.toString()}`;
        } else {
            // search mode
            const q = artistName ? `${songTitle} ${artistName}` : songTitle;
            searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(q)}`;
        }
        
        console.log(`[LRCLIB] Fetching: ${searchUrl}`);
        
        https.get(searchUrl, {
            headers: {
                'User-Agent': 'ESP32MusicServer/1.0 (https://github.com/conghuy93/youtu)',
                'Accept': 'application/json'
            },
            timeout: 8000
        }, (response) => {
            if (response.statusCode !== 200) {
                response.resume();
                return reject(new Error(`LRCLIB HTTP ${response.statusCode}`));
            }
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    
                    // Direct match response (single object)
                    if (json && !Array.isArray(json)) {
                        if (json.syncedLyrics) {
                            console.log(`[LRCLIB] Got synced lyrics: ${json.trackName} - ${json.artistName} (${json.syncedLyrics.split('\n').length} lines)`);
                            return resolve({ lrc: json.syncedLyrics, source: 'lrclib-synced', artist: json.artistName, title: json.trackName });
                        }
                        if (json.plainLyrics) {
                            console.log(`[LRCLIB] Got plain lyrics only: ${json.trackName} - ${json.artistName}`);
                            return resolve({ plain: json.plainLyrics, source: 'lrclib-plain', artist: json.artistName, title: json.trackName });
                        }
                    }
                    
                    // Search results (array)
                    if (Array.isArray(json) && json.length > 0) {
                        // Prefer results with synced lyrics
                        const synced = json.find(r => r.syncedLyrics);
                        if (synced) {
                            console.log(`[LRCLIB] Search found synced: ${synced.trackName} - ${synced.artistName} (${synced.syncedLyrics.split('\n').length} lines)`);
                            return resolve({ lrc: synced.syncedLyrics, source: 'lrclib-synced', artist: synced.artistName, title: synced.trackName });
                        }
                        const plain = json.find(r => r.plainLyrics);
                        if (plain) {
                            console.log(`[LRCLIB] Search found plain: ${plain.trackName} - ${plain.artistName}`);
                            return resolve({ plain: plain.plainLyrics, source: 'lrclib-plain', artist: plain.artistName, title: plain.trackName });
                        }
                    }
                    
                    reject(new Error('No lyrics found on LRCLIB'));
                } catch (e) {
                    reject(new Error(`LRCLIB parse error: ${e.message}`));
                }
            });
            response.on('error', reject);
        }).on('error', reject).on('timeout', () => reject(new Error('LRCLIB timeout')));
    });
}

// Try LRCLIB search with fallback queries (exact match -> search)
async function tryLrclibLyrics(songTitle, artistName, durationSec) {
    // Clean artist name (remove "Music", "Official", "VEVO", etc.)
    const cleanArtist = (artistName || '')
        .replace(/\s*(Music|Official|VEVO|Records|Entertainment|Channel|Topic)\s*$/gi, '')
        .trim();
    
    // Step 1: Try exact match with /api/get (with cleaned artist)
    if (songTitle && cleanArtist) {
        try {
            return await fetchLrclibLyrics(songTitle, cleanArtist, durationSec);
        } catch (e) {
            console.log(`[LRCLIB] Exact match failed: ${e.message}`);
        }
    }
    
    // Step 2: Try /api/search?q= with song + artist (broad search)
    try {
        const query = cleanArtist ? `${songTitle} ${cleanArtist}` : songTitle;
        return await fetchLrclibSearch(query);
    } catch (e) {
        console.log(`[LRCLIB] Search failed: ${e.message}`);
    }
    
    // Step 3: Try search with just song title
    if (cleanArtist) {
        try {
            return await fetchLrclibSearch(songTitle);
        } catch (e) {
            console.log(`[LRCLIB] Title-only search failed: ${e.message}`);
        }
    }
    
    // Step 4: Try with cleaned title (remove "Official MV", "Lyric Video", etc.)
    const cleanTitle = songTitle
        .replace(/\s*[\|\-]\s*(Official|OFFICIAL|MV|M\/V|Music Video|Lyric Video|Audio|HD|4K|Lyrics?|LYRICS?|Visualizer|Live|LIVE|Official MV|OFFICIAL MV).*$/gi, '')
        .replace(/\s*\([^)]*(?:Official|MV|Lyric|Audio|Live|Remix)[^)]*\)/gi, '')
        .replace(/\s*\[[^\]]*(?:Official|MV|Lyric|Audio|Live|Remix)[^\]]*\]/gi, '')
        .trim();
    
    if (cleanTitle !== songTitle && cleanTitle.length > 0) {
        console.log(`[LRCLIB] Retrying with cleaned title: "${cleanTitle}"`);
        try {
            return await fetchLrclibSearch(cleanTitle);
        } catch (e) {
            console.log(`[LRCLIB] Cleaned search also failed: ${e.message}`);
        }
    }
    
    return null;
}

// LRCLIB search endpoint (/api/search?q=...)
async function fetchLrclibSearch(query) {
    return new Promise((resolve, reject) => {
        const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
        console.log(`[LRCLIB] Search: ${searchUrl}`);
        
        https.get(searchUrl, {
            headers: {
                'User-Agent': 'ESP32MusicServer/1.0 (https://github.com/conghuy93/youtu)',
                'Accept': 'application/json'
            },
            timeout: 8000
        }, (response) => {
            if (response.statusCode !== 200) {
                response.resume();
                return reject(new Error(`LRCLIB search HTTP ${response.statusCode}`));
            }
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => {
                try {
                    const results = JSON.parse(data);
                    if (!Array.isArray(results) || results.length === 0) {
                        return reject(new Error('No search results'));
                    }
                    // Prefer synced lyrics
                    const synced = results.find(r => r.syncedLyrics);
                    if (synced) {
                        console.log(`[LRCLIB] Search found synced: ${synced.trackName} - ${synced.artistName} (${synced.syncedLyrics.split('\n').length} lines)`);
                        return resolve({ lrc: synced.syncedLyrics, source: 'lrclib-synced', artist: synced.artistName, title: synced.trackName });
                    }
                    const plain = results.find(r => r.plainLyrics);
                    if (plain) {
                        console.log(`[LRCLIB] Search found plain: ${plain.trackName} - ${plain.artistName}`);
                        return resolve({ plain: plain.plainLyrics, source: 'lrclib-plain', artist: plain.artistName, title: plain.trackName });
                    }
                    reject(new Error('No lyrics in search results'));
                } catch (e) {
                    reject(new Error(`Parse error: ${e.message}`));
                }
            });
            response.on('error', reject);
        }).on('error', reject).on('timeout', () => reject(new Error('timeout')));
    });
}

// ============================================================
// PARALLEL TIMING: Merge LRCLIB text with YouTube timestamps
// LRCLIB = correct text (human transcribed)
// YouTube auto-captions = correct timing (synced to actual video)
// Result = correct text + accurate timing
// ============================================================

/**
 * Parse LRC text into array of {time_ms, text}
 */
function parseLrcToLines(lrcText) {
    const lines = [];
    for (const line of lrcText.split('\n')) {
        const match = line.match(/^\[(\d+):(\d+(?:\.\d+)?)\](.*)/);
        if (!match) continue;
        const minutes = parseInt(match[1]);
        const seconds = parseFloat(match[2]);
        const time_ms = minutes * 60000 + Math.round(seconds * 1000);
        const text = match[3].trim();
        lines.push({ time_ms, text });
    }
    return lines;
}

/**
 * Convert array of {time_ms, text} back to LRC text
 */
function linesToLrc(lines) {
    return lines.map(l => {
        const min = Math.floor(l.time_ms / 60000);
        const sec = ((l.time_ms % 60000) / 1000).toFixed(2);
        return `[${min.toString().padStart(2, '0')}:${sec.padStart(5, '0')}]${l.text}`;
    }).join('\n');
}

/**
 * Fetch YouTube auto-captions timestamps for a video
 * Returns SRT content string (or null)
 */
async function fetchYouTubeSubsRaw(videoId) {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const subLangs = 'vi,en';
    const tmpDir = path.join(os.tmpdir(), 'yt-subs');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const tmpFile = path.join(tmpDir, `timing_${videoId}`);
    
    // Clean up old files
    for (const ext of ['.vi.srt', '.en.srt', '.srt']) {
        const f = tmpFile + ext;
        if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    
    let srtContent = '';
    
    for (const subFlag of ['--write-sub', '--write-auto-sub']) {
        if (srtContent) break;
        try {
            await new Promise((resolve, reject) => {
                const args = [
                    subFlag, '--sub-lang', subLangs, '--sub-format', 'srt',
                    '--skip-download', '--no-warnings', '-o', tmpFile, videoUrl
                ];
                execFile(YTDLP_PATH, args, { timeout: 20000 }, (err) => {
                    if (err && !fs.existsSync(tmpFile + '.vi.srt') && !fs.existsSync(tmpFile + '.en.srt')) {
                        return reject(err);
                    }
                    resolve();
                });
            });
        } catch (e) {
            continue;
        }
        
        for (const lang of ['vi', 'en']) {
            const srtFile = `${tmpFile}.${lang}.srt`;
            if (fs.existsSync(srtFile)) {
                srtContent = fs.readFileSync(srtFile, 'utf-8');
                fs.unlinkSync(srtFile);
                break;
            }
        }
    }
    
    // Cleanup
    for (const ext of ['.vi.srt', '.en.srt']) {
        const f = tmpFile + ext;
        if (fs.existsSync(f)) try { fs.unlinkSync(f); } catch(e) {}
    }
    
    return srtContent || null;
}

/**
 * Align LRCLIB lyrics text with YouTube auto-caption timestamps
 * 
 * Algorithm:
 * 1. Parse both into {time_ms, text} arrays
 * 2. Find first and last singing lines in both
 * 3. Calculate linear time mapping: t_new = (t_lrc - lrc_start) * scale + yt_start
 * 4. Apply to all LRCLIB lines → correct text with accurate YouTube timing
 */
function alignLyricsWithYouTubeTiming(lrclibLrc, youtubeSrt) {
    // Parse LRCLIB lines
    const lrcLines = parseLrcToLines(lrclibLrc);
    if (lrcLines.length === 0) return lrclibLrc;
    
    // Parse YouTube SRT to get timestamps
    const ytLrc = convertSRTtoLRC(youtubeSrt);
    if (!ytLrc) return lrclibLrc;
    const ytLines = parseLrcToLines(ytLrc);
    if (ytLines.length < 3) return lrclibLrc; // Not enough YouTube data
    
    // Find first and last non-empty lines in both
    const lrcSinging = lrcLines.filter(l => l.text.length > 0);
    const ytSinging = ytLines.filter(l => l.text.length > 0);
    
    if (lrcSinging.length === 0 || ytSinging.length === 0) return lrclibLrc;
    
    const lrcFirst = lrcSinging[0].time_ms;
    const lrcLast = lrcSinging[lrcSinging.length - 1].time_ms;
    const ytFirst = ytSinging[0].time_ms;
    const ytLast = ytSinging[ytSinging.length - 1].time_ms;
    
    console.log(`[Timing] LRCLIB: ${lrcSinging.length} lines, first=${lrcFirst}ms, last=${lrcLast}ms`);
    console.log(`[Timing] YouTube: ${ytSinging.length} lines, first=${ytFirst}ms, last=${ytLast}ms`);
    
    // Calculate linear mapping: t_new = (t - lrcFirst) * scale + ytFirst
    const lrcSpan = lrcLast - lrcFirst;
    const ytSpan = ytLast - ytFirst;
    
    let scale = 1.0;
    if (lrcSpan > 1000 && ytSpan > 1000) {
        scale = ytSpan / lrcSpan;
        // Sanity check: scale should be close to 1.0 (0.8 - 1.2)
        if (scale < 0.7 || scale > 1.5) {
            console.log(`[Timing] Scale ${scale.toFixed(3)} out of range, using offset-only`);
            scale = 1.0;
        }
    }
    
    const offset = ytFirst - lrcFirst * scale;
    console.log(`[Timing] Alignment: scale=${scale.toFixed(4)}, offset=${offset.toFixed(0)}ms`);
    
    // Apply mapping to all LRCLIB lines
    const alignedLines = lrcLines.map(l => ({
        time_ms: Math.max(0, Math.round(l.time_ms * scale + offset)),
        text: l.text
    }));
    
    return linesToLrc(alignedLines);
}

// Get lyrics - Priority: LRCLIB text + YouTube timing (parallel) -> LRCLIB only -> YouTube only
// Supports: ?id=VIDEO_ID or ?url=YOUTUBE_URL or ?song=SONG_NAME&artist=ARTIST
app.get('/api/lyric', async (req, res) => {
    const { url, id, song, artist, format: fmt } = req.query;
    
    try {
        let videoId = null;
        let songTitle = song || '';
        let artistName = artist || '';
        let durationSec = 0;
        
        // Method 1: Direct video ID or URL
        if (id) {
            videoId = id;
        } else if (url) {
            videoId = extractVideoId(url);
        } else if (song) {
            // Method 2: Search by song name (for ESP32 fallback)
            let query = song;
            if (artist) query = `${song} ${artist}`;
            
            let results;
            if (typeof search === 'function') {
                results = await search(query, { limit: 3, type: 'video' });
            } else if (youtubeSr.default && typeof youtubeSr.default.search === 'function') {
                results = await youtubeSr.default.search(query, { limit: 3, type: 'video' });
            } else if (typeof youtubeSr.search === 'function') {
                results = await youtubeSr.search(query, { limit: 3, type: 'video' });
            }
            
            if (results && results.length > 0) {
                videoId = results[0].id;
                if (!songTitle) songTitle = results[0].title || '';
                if (!artistName) artistName = results[0].channel?.name || '';
                durationSec = results[0].duration ? Math.floor(results[0].duration / 1000) : 0;
                console.log(`[YouTube API] Lyric search: "${query}" -> ${results[0].title} (${videoId})`);
            }
        }
        
        // If we have video ID but no title/artist, try to get info
        if (videoId && !songTitle) {
            try {
                // Use yt-dlp for reliable title extraction (ytdl-core often fails/blocked)
                const videoInfo = await new Promise((resolve, reject) => {
                    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
                    execFile(YTDLP_PATH, ['--dump-json', '--no-warnings', videoUrl], 
                        { timeout: 15000 }, 
                        (err, stdout, stderr) => {
                            if (err) return reject(err);
                            try {
                                const json = JSON.parse(stdout);
                                resolve(json);
                            } catch (e) {
                                reject(new Error(`Failed to parse yt-dlp JSON: ${e.message}`));
                            }
                        }
                    );
                });
                
                songTitle = videoInfo.title || '';
                artistName = videoInfo.uploader || videoInfo.channel || '';
                durationSec = Math.floor(videoInfo.duration || 0);
                
                console.log(`[YouTube API] Extracted from video ${videoId}: "${songTitle}" by "${artistName}" (${durationSec}s)`);
            } catch (e) {
                console.log(`[YouTube API] Could not get video info for title extraction: ${e.message}`);
                // Fallback: try ytdl-core as last resort
                try {
                    const info = await ytdl.getBasicInfo(`https://www.youtube.com/watch?v=${videoId}`);
                    songTitle = info.videoDetails?.title || '';
                    artistName = info.videoDetails?.author?.name || '';
                    durationSec = parseInt(info.videoDetails?.lengthSeconds || '0');
                    console.log(`[YouTube API] Fallback ytdl-core: "${songTitle}" by "${artistName}"`);
                } catch (e2) {
                    console.log(`[YouTube API] ytdl-core also failed: ${e2.message}`);
                }
            }
        }
        
        // Extract clean title/artist from YouTube title format
        // Common patterns: "Artist - Song Title [Official MV]", "SONG | ARTIST | OFFICIAL MV"
        if (songTitle && !artist) {
            // Remove common suffixes first
            let cleanedTitle = songTitle
                .replace(/\s*[\[\(]?\s*(?:Official\s*(?:Video|MV|M\/V|Music\s*Video|Audio|Lyric\s*Video)?|OFFICIAL\s*(?:VIDEO|MV|MUSIC\s*VIDEO)?|MV|M\/V|Lyric\s*Video|Audio|HD|4K|Visualizer|Vietsub|Lyrics?|LYRICS?|Live|LIVE)\s*[\]\)]?\s*/gi, ' ')
                .replace(/\s*[\[\(][^\]\)]*(?:Soundtrack|OST|Remix|Cover|Karaoke|Instrumental)[^\]\)]*[\]\)]\s*/gi, ' ')
                .replace(/\s*ft\.?\s*/gi, ' ft. ')
                .replace(/\s+/g, ' ')
                .trim();
            
            // Detect separator and split
            let separator = null;
            if (cleanedTitle.includes('|')) {
                separator = '|';
            } else if (cleanedTitle.match(/[\-–—]/)) {
                separator = '-';
            }
            
            if (separator) {
                const parts = cleanedTitle.split(separator).map(p => p.trim()).filter(p => p);
                if (parts.length >= 2) {
                    const part1 = parts[0];
                    const part2 = parts[1]
                        .replace(/\s*ft\.?\s+.*$/i, '') // remove ft. from end
                        .trim();
                    
                    // For Vietnamese music: "|" separator almost always means "SONG | ARTIST"
                    if (separator === '|') {
                        songTitle = part1;
                        artistName = part2;
                    } else {
                        // For "-" separator: use heuristics
                        if (artistName) {
                            // Check for partial or full match with channel name
                            const artistLower = artistName.toLowerCase();
                            const p1Lower = part1.toLowerCase();
                            const p2Lower = part2.toLowerCase();
                            
                            // Extract key words from artist name (e.g., "ICM" from "ICM Entertainment")
                            const artistWords = artistLower.split(/\s+/).filter(w => w.length > 2);
                            
                            // Check word-level matches
                            const p1HasArtist = artistWords.some(w => p1Lower.includes(w));
                            const p2HasArtist = artistWords.some(w => p2Lower.includes(w));
                            
                            if (p1HasArtist && !p2HasArtist) {
                                // Part1 is artist, Part2 is song
                                artistName = part1;
                                songTitle = part2;
                            } else if (p2HasArtist && !p1HasArtist) {
                                // Part2 is artist, Part1 is song
                                songTitle = part1;
                                artistName = part2;
                            } else {
                                // Can't determine - assume "Artist - Song" (most common for "-")
                                artistName = part1;
                                songTitle = part2;
                            }
                        } else {
                            // No artist info - assume "Artist - Song" format
                            artistName = part1;
                            songTitle = part2;
                        }
                    }
                } else {
                    songTitle = cleanedTitle;
                }
            } else {
                songTitle = cleanedTitle;
            }
            
            // Final cleanup: remove "ft. XYZ" from songTitle for cleaner LRCLIB search
            songTitle = songTitle.replace(/\s*ft\.?\s+.*$/i, '').trim();
        }
        
        console.log(`[Lyrics] Looking up: title="${songTitle}" artist="${artistName}" duration=${durationSec}s`);
        
        // ===== PARALLEL FETCH: LRCLIB (text) + YouTube (timing) simultaneously =====
        let lrcText = '';
        let lrcSource = '';
        
        if (videoId) {
            // Run LRCLIB and YouTube subtitle fetching IN PARALLEL
            console.log(`[Lyrics] Parallel fetch: LRCLIB + YouTube subs for ${videoId}`);
            
            const [lrcResult, ytSrt] = await Promise.all([
                tryLrclibLyrics(songTitle, artistName, durationSec).catch(e => {
                    console.log(`[Lyrics] LRCLIB failed: ${e.message}`);
                    return null;
                }),
                fetchYouTubeSubsRaw(videoId).catch(e => {
                    console.log(`[Lyrics] YouTube subs failed: ${e.message}`);
                    return null;
                })
            ]);
            
            if (lrcResult && lrcResult.lrc) {
                // LRCLIB has synced lyrics
                if (ytSrt) {
                    // BEST CASE: Both available → merge LRCLIB text with YouTube timing
                    console.log(`[Lyrics] ★ Merging LRCLIB text + YouTube timing (parallel alignment)`);
                    lrcText = alignLyricsWithYouTubeTiming(lrcResult.lrc, ytSrt);
                    lrcSource = 'lrclib+youtube-timing';
                } else {
                    // YouTube subs not available → use LRCLIB timing as-is
                    lrcText = lrcResult.lrc;
                    lrcSource = lrcResult.source;
                    console.log(`[Lyrics] Using LRCLIB synced lyrics only (no YouTube timing available)`);
                }
            } else if (lrcResult && lrcResult.plain) {
                // LRCLIB has plain lyrics only → use YouTube timing if available
                const plainLines = lrcResult.plain.split('\n').filter(l => l.trim());
                if (ytSrt) {
                    // Map plain text lines to YouTube timestamps
                    const ytLrc = convertSRTtoLRC(ytSrt);
                    const ytLines = ytLrc ? parseLrcToLines(ytLrc) : [];
                    const ytSinging = ytLines.filter(l => l.text.length > 0);
                    
                    if (ytSinging.length > 0) {
                        // Distribute plain text lines across YouTube timestamps
                        const merged = [];
                        const ratio = plainLines.length / ytSinging.length;
                        for (let i = 0; i < ytSinging.length && i * ratio < plainLines.length; i++) {
                            const textIdx = Math.min(Math.floor(i * ratio), plainLines.length - 1);
                            merged.push({ time_ms: ytSinging[i].time_ms, text: plainLines[textIdx] });
                        }
                        lrcText = linesToLrc(merged);
                        lrcSource = 'lrclib-plain+youtube-timing';
                        console.log(`[Lyrics] Merged ${plainLines.length} plain lines with ${ytSinging.length} YouTube timestamps`);
                    }
                }
                
                if (!lrcText) {
                    // No YouTube timing → generate dummy timestamps
                    lrcText = plainLines.map((line, i) => {
                        const min = Math.floor(i * 5 / 60);
                        const sec = (i * 5) % 60;
                        return `[${min.toString().padStart(2, '0')}:${sec.toFixed(2).padStart(5, '0')}]${line}`;
                    }).join('\n');
                    lrcSource = lrcResult.source;
                    console.log(`[Lyrics] Using LRCLIB plain lyrics with generated timestamps`);
                }
            } else if (ytSrt) {
                // NO LRCLIB → fallback to YouTube auto-captions (garbled text but accurate timing)
                lrcText = convertSRTtoLRC(ytSrt);
                lrcSource = 'youtube-auto';
                console.log(`[Lyrics] Fallback: YouTube auto-captions only (no LRCLIB match)`);
            }
        } else {
            // No video ID → LRCLIB only (song/artist search)
            const lrcResult = await tryLrclibLyrics(songTitle, artistName, durationSec);
            if (lrcResult) {
                if (lrcResult.lrc) {
                    lrcText = lrcResult.lrc;
                    lrcSource = lrcResult.source;
                } else if (lrcResult.plain) {
                    const lines = lrcResult.plain.split('\n').filter(l => l.trim());
                    lrcText = lines.map((line, i) => {
                        const min = Math.floor(i * 5 / 60);
                        const sec = (i * 5) % 60;
                        return `[${min.toString().padStart(2, '0')}:${sec.toFixed(2).padStart(5, '0')}]${line}`;
                    }).join('\n');
                    lrcSource = lrcResult.source;
                }
            }
        }
        
        // No lyrics from any source
        if (!lrcText) {
            if (!videoId && !song) {
                return res.status(400).json({ success: false, error: 'Missing parameter: url, id, or song' });
            }
            return res.status(404).json({ success: false, error: 'No lyrics available from any source' });
        }
        
        // Return based on format
        if (fmt === 'lrc' || fmt === 'text') {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.send(lrcText);
        } else {
            res.json({
                success: true,
                id: videoId,
                source: lrcSource,
                lyrics: lrcText,
                lrc: lrcText
            });
        }
        
        console.log(`[Lyrics] Returned ${lrcSource} lyrics for "${songTitle}" (${lrcText.split('\n').length} lines)`);
        
    } catch (error) {
        recordError();
        console.error('[Lyrics] Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Convert SRT subtitle format to LRC format
function convertSRTtoLRC(srtContent) {
    const lines = [];
    // SRT format: sequence number, timestamp line, text, blank line
    // Timestamp: 00:00:00,320 --> 00:00:14,040
    const blocks = srtContent.split(/\n\s*\n/);
    
    for (const block of blocks) {
        const blockLines = block.trim().split('\n');
        if (blockLines.length < 2) continue;
        
        // Find timestamp line (contains -->)
        let timeLineIdx = -1;
        for (let i = 0; i < blockLines.length; i++) {
            if (blockLines[i].includes('-->')) {
                timeLineIdx = i;
                break;
            }
        }
        if (timeLineIdx === -1) continue;
        
        // Parse start time: HH:MM:SS,mmm or HH:MM:SS.mmm
        const timeMatch = blockLines[timeLineIdx].match(/(\d+):(\d+):(\d+)[,.]?(\d*)/);
        if (!timeMatch) continue;
        
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const seconds = parseInt(timeMatch[3]);
        const ms = parseInt((timeMatch[4] || '0').padEnd(3, '0'));
        
        const totalMinutes = hours * 60 + minutes;
        const totalSec = seconds + ms / 1000;
        
        // Get text (everything after timestamp line)
        const text = blockLines.slice(timeLineIdx + 1).join(' ')
            .replace(/<[^>]+>/g, '') // Remove HTML tags
            .replace(/\[.*?\]/g, '') // Remove [Music] etc.  
            .trim();
        
        if (!text) continue;
        
        const secStr = totalSec.toFixed(2);
        lines.push(`[${totalMinutes.toString().padStart(2, '0')}:${secStr.padStart(5, '0')}]${text}`);
    }
    
    return lines.length > 0 ? lines.join('\n') : null;
}

// Helper: Fetch URL content (follows redirects, sets User-Agent)
function fetchUrl(url, maxRedirects = 5) {
    return new Promise((resolve, reject) => {
        if (maxRedirects <= 0) {
            return reject(new Error('Too many redirects'));
        }
        const client = url.startsWith('https') ? https : http;
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
            }
        };
        client.get(url, options, (response) => {
            // Follow redirects
            if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
                const redirectUrl = new URL(response.headers.location, url).toString();
                console.log(`[YouTube API] Redirect ${response.statusCode}: ${redirectUrl.substring(0, 80)}...`);
                response.resume();
                return fetchUrl(redirectUrl, maxRedirects - 1).then(resolve).catch(reject);
            }
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}`));
                response.resume();
                return;
            }
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => resolve(data));
            response.on('error', reject);
        }).on('error', reject);
    });
}

// Helper: Convert YouTube captions (XML/JSON) to LRC format
function convertCaptionsToLRC(content) {
    let lines = [];
    
    // Try parsing as JSON (srv3 format) first
    try {
        const json = JSON.parse(content);
        if (json.events) {
            for (const event of json.events) {
                if (!event.segs) continue;
                const text = event.segs.map(s => s.utf8 || '').join('').trim();
                if (!text || text === '\n') continue;
                const startMs = event.tStartMs || 0;
                const minutes = Math.floor(startMs / 60000);
                const seconds = ((startMs % 60000) / 1000).toFixed(2);
                lines.push(`[${minutes.toString().padStart(2, '0')}:${seconds.padStart(5, '0')}]${text}`);
            }
            console.log(`[YouTube API] Parsed srv3 JSON: ${lines.length} lines`);
        }
    } catch (e) {
        // Not JSON, try XML
    }
    
    // Try parsing as XML (timedtext format) if JSON failed
    if (lines.length === 0) {
        // YouTube timedtext XML: <text start="seconds" dur="seconds">content</text>
        const xmlPattern = /<text\s+start=["']?([\d.]+)["']?\s+dur=["']?([\d.]+)["']?[^>]*>([\s\S]*?)<\/text>/gi;
        let match;
        while ((match = xmlPattern.exec(content)) !== null) {
            const startSec = parseFloat(match[1]);
            let text = match[3]
                .replace(/<[^>]+>/g, '') // Remove HTML tags
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&apos;/g, "'")
                .replace(/\n/g, ' ')
                .trim();
            
            if (!text) continue;
            
            const totalMs = startSec * 1000;
            const minutes = Math.floor(totalMs / 60000);
            const seconds = ((totalMs % 60000) / 1000).toFixed(2);
            lines.push(`[${minutes.toString().padStart(2, '0')}:${seconds.padStart(5, '0')}]${text}`);
        }
        console.log(`[YouTube API] Parsed XML timedtext: ${lines.length} lines`);
    }
    
    // Fallback: try TTML format <p begin="HH:MM:SS.mmm" end="...">content</p>
    if (lines.length === 0) {
        const ttmlPattern = /<p\s+[^>]*begin=["']?([\d.:]+)["']?[^>]*>([\s\S]*?)<\/p>/gi;
        let match;
        while ((match = ttmlPattern.exec(content)) !== null) {
            const timeStr = match[1];
            let text = match[2]
                .replace(/<[^>]+>/g, '')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/\n/g, ' ')
                .trim();
            
            if (!text) continue;
            
            let totalMs = 0;
            if (timeStr.includes(':')) {
                const parts = timeStr.split(':');
                if (parts.length === 3) {
                    totalMs = (parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2])) * 1000;
                } else if (parts.length === 2) {
                    totalMs = (parseInt(parts[0]) * 60 + parseFloat(parts[1])) * 1000;
                }
            } else {
                totalMs = parseFloat(timeStr) * 1000;
            }
            
            const minutes = Math.floor(totalMs / 60000);
            const seconds = ((totalMs % 60000) / 1000).toFixed(2);
            lines.push(`[${minutes.toString().padStart(2, '0')}:${seconds.padStart(5, '0')}]${text}`);
        }
        console.log(`[YouTube API] Parsed TTML: ${lines.length} lines`);
    }
    
    return lines.length > 0 ? lines.join('\n') : null;
}

// Search YouTube videos
app.get('/api/search', async (req, res) => {
    const { q, limit = 20 } = req.query;
    
    if (!q) {
        recordError();
        return res.status(400).json({
            success: false,
            error: 'Missing parameter: q (query)'
        });
    }
    
    try {
        // Handle different youtube-sr versions
        let results;
        if (typeof search === 'function') {
            results = await search(q, {
                limit: parseInt(limit),
                type: 'video'
            });
        } else if (youtubeSr.default && typeof youtubeSr.default.search === 'function') {
            results = await youtubeSr.default.search(q, {
                limit: parseInt(limit),
                type: 'video'
            });
        } else if (typeof youtubeSr.search === 'function') {
            results = await youtubeSr.search(q, {
                limit: parseInt(limit),
                type: 'video'
            });
        } else {
            throw new Error('youtube-sr search function not available');
        }
        
        res.json({
            success: true,
            data: results.map(video => ({
                id: video.id,
                title: video.title,
                description: video.description,
                thumbnail: video.thumbnail?.url,
                duration: video.durationFormatted,
                durationSeconds: video.duration,
                url: video.url,
                channel: {
                    name: video.channel?.name,
                    url: video.channel?.url
                },
                views: video.views,
                uploadedAt: video.uploadedAt
            }))
        });
    } catch (error) {
        recordError();
        console.error('[YouTube API] Search error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Stats endpoint
app.get('/stats', (req, res) => {
    const uptimeMs = Date.now() - metrics.startTime;
    const mem = process.memoryUsage();
    
    res.json({
        uptime_seconds: Math.round(uptimeMs / 1000),
        total_requests: metrics.totalRequests,
        last_request_at: metrics.lastRequestAt,
        per_endpoint: metrics.perEndpoint,
        errors: metrics.errors,
        downloads: metrics.downloads,
        memory_mb: {
            rss: Math.round(mem.rss / 1024 / 1024),
            heap_used: Math.round(mem.heapUsed / 1024 / 1024),
            heap_total: Math.round(mem.heapTotal / 1024 / 1024)
        },
        load_avg: os.loadavg(),
        timestamp: new Date().toISOString()
    });
});

// Helper function: Format duration
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path,
        method: req.method,
        availableEndpoints: [
            'GET /health',
            'GET /stream_pcm?song=...&artist=...',
            'GET /api/info?url=... or ?id=...',
            'GET /api/mp3?url=... or ?id=...',
            'GET /api/mp4?url=... or ?id=...',
            'GET /api/stream/mp3?url=... or ?id=...',
            'GET /api/lyric?id=...&format=lrc or ?song=...&artist=...',
            'GET /api/search?q=...',
            'GET /stats'
        ]
    });
});

async function selectAudioFormat(videoInfo, videoId, infoSource) {
    let selectedFormat = null;
    
    if (infoSource === 'ytdl' && Array.isArray(videoInfo?.formats)) {
        selectedFormat = trySelectFormatFromYtdl(videoInfo);
        if (selectedFormat && selectedFormat.url) {
            return { format: selectedFormat, provider: 'ytdl' };
        }
    }
    
    try {
        const ytDlpUrl = await getYtDlpDirectUrl(videoId);
        if (ytDlpUrl) {
            return {
                format: {
                    url: ytDlpUrl,
                    mimeType: 'audio/webm',
                    audioBitrate: 160,
                    itag: 'yt-dlp',
                    fromYtDlp: true
                },
                provider: 'yt-dlp'
            };
        }
    } catch (error) {
        console.error(`[YouTube API] yt-dlp fallback error for ${videoId}:`, error.message);
    }
    
    return { format: null, provider: null };
}

function trySelectFormatFromYtdl(videoInfo) {
    if (!Array.isArray(videoInfo?.formats)) return null;
    
    const chooseFormatOptions = [
        { quality: 'highestaudio', filter: 'audioonly' },
        { quality: 'highestaudio' },
        { quality: 'lowestaudio', filter: 'audioonly' },
        { quality: 'lowestaudio' },
        { filter: 'audioonly' },
        { quality: 'highest' }
    ];
    
    for (const options of chooseFormatOptions) {
        try {
            const format = ytdl.chooseFormat(videoInfo.formats, options);
            if (format && format.url) {
                console.log('[YouTube API] Found format via ytdl.chooseFormat:', options);
                return format;
            }
        } catch (_) {
            continue;
        }
    }
    
    const audioOnly = videoInfo.formats.filter(format => format.hasAudio && !format.hasVideo && format.url);
    if (audioOnly.length > 0) {
        // ESP32 hỗ trợ: MP3 và AAC (ADTS)
        // YouTube itag 140 = AAC trong m4a container (MP4), KHÔNG phải ADTS → ESP32 không decode được
        // Ưu tiên Opus (itag 251, 250, 249) - ESP32 có thể hỗ trợ Opus hoặc sẽ fallback về MP3 convert
        // Bỏ itag 140 (m4a) vì ESP32 không decode được m4a container
        const preferredItags = [251, 250, 249]; // Opus formats (ESP32 có thể hỗ trợ hoặc sẽ convert sang MP3)
        for (const itag of preferredItags) {
            const fmt = audioOnly.find(f => f.itag === itag);
            if (fmt && fmt.url) {
                const formatName = itag === 251 ? 'Opus 160kbps' : (itag === 250 ? 'Opus 70kbps' : 'Opus 50kbps');
                console.log(`[YouTube API] Found preferred audio format: ${formatName} (itag=${itag})`);
                console.log(`[YouTube API] Note: ESP32 hỗ trợ MP3 và AAC (ADTS), Opus sẽ được convert nếu cần`);
                return fmt;
            }
        }
        // Fallback: thử itag 140 (AAC m4a) nhưng sẽ cần convert sang ADTS hoặc MP3
        const aacFormat = audioOnly.find(f => f.itag === 140);
        if (aacFormat && aacFormat.url) {
            console.log(`[YouTube API] Found AAC (m4a) format (itag=140), but ESP32 needs AAC ADTS - may need conversion`);
            return aacFormat;
        }
        const highBitrate = audioOnly
            .filter(f => f.audioBitrate)
            .sort((a, b) => (parseInt(b.audioBitrate) || 0) - (parseInt(a.audioBitrate) || 0))[0];
        if (highBitrate) return highBitrate;
        return audioOnly[0];
    }
    
    const adaptive = videoInfo.formats.filter(format => format.hasAudio && format.url);
    if (adaptive.length > 0) {
        return adaptive
            .filter(f => f.audioBitrate)
            .sort((a, b) => {
                if (a.hasVideo !== b.hasVideo) return a.hasVideo ? 1 : -1;
                return (parseInt(b.audioBitrate) || 0) - (parseInt(a.audioBitrate) || 0);
            })[0] || adaptive[0];
    }
    
    return null;
}

async function getYtDlpDirectUrl(videoId) {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    // CHỈ LẤY M4A (MP4 + AAC) - KHÔNG FALLBACK VỀ WebM
    // YouTube itag 140 = AAC 128kbps trong m4a container (phổ biến nhất)
    // itag 141 = AAC 256kbps, itag 139 = AAC 48kbps
    // Đơn giản hóa: chỉ dùng itag cụ thể (nhanh nhất) hoặc ext=m4a
    const args = ['-g', '-f', '140/141/139/bestaudio[ext=m4a]', videoUrl, '--no-playlist', '--quiet'];
    const startTime = Date.now();
    console.log(`[YouTube API] Running yt-dlp for ${videoId} with format: 140/141/139/bestaudio[ext=m4a]`);
    const stdout = await runYtDlp(args);
    const elapsed = Date.now() - startTime;
    console.log(`[YouTube API] yt-dlp completed for ${videoId} in ${elapsed}ms`);
    const directUrl = stdout.split('\n').map(line => line.trim()).find(Boolean);
    if (!directUrl) {
        throw new Error('yt-dlp returned no URL');
    }
    
    // Kiểm tra xem có phải M4A không - NẾU KHÔNG PHẢI M4A THÌ BÁO LỖI
    const isM4A = directUrl.includes('itag=141') || 
                  directUrl.includes('itag=140') || 
                  directUrl.includes('itag=139') ||
                  directUrl.includes('.m4a') || 
                  directUrl.includes('mime=audio/mp4');
    
    if (!isM4A) {
        // Nếu không phải M4A, throw error ngay (không retry để tránh timeout)
        throw new Error(`Video ${videoId} does not have M4A (AAC) format available. Only WebM/Opus available, but server is configured to only serve M4A.`);
    }
    
    // Detect và log format
    let formatType = 'M4A (AAC)';
    let itag = null;
    if (directUrl.includes('itag=141')) {
        formatType = 'M4A (AAC 256kbps)';
        itag = 141;
    } else if (directUrl.includes('itag=140')) {
        formatType = 'M4A (AAC 128kbps)';
        itag = 140;
    } else if (directUrl.includes('itag=139')) {
        formatType = 'M4A (AAC 48kbps)';
        itag = 139;
    }
    
    console.log(`[YouTube API] Got audio URL for ${videoId}: ${formatType}${itag ? ` (itag=${itag})` : ''}`);
    return directUrl;
}

async function getYtDlpInfo(videoId) {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const args = ['-J', videoUrl, '--no-playlist', '--quiet'];
    const stdout = await runYtDlp(args);
    let json;
    try {
        json = JSON.parse(stdout);
    } catch (error) {
        throw new Error('yt-dlp returned invalid JSON');
    }
    if (!json) {
        throw new Error('yt-dlp returned empty info');
    }
    return normalizeYtDlpInfo(json);
}

function normalizeYtDlpInfo(json) {
    const thumbnails = (json.thumbnails || [])
        .map(t => ({ url: t.url || t.thumbnail || t.webp }))
        .filter(t => !!t.url);
    
    return {
        videoDetails: {
            title: json.title || 'Unknown Title',
            author: { name: json.uploader || json.channel || 'Unknown Artist' },
            thumbnails: thumbnails.length ? thumbnails : (json.thumbnail ? [{ url: json.thumbnail }] : []),
            lengthSeconds: json.duration ? String(json.duration) : '0'
        }
    };
}

function proxyExternalAudio(directUrl, req, res, mimeType = 'audio/mp4') {
    // CHỈ PROXY M4A (AAC) - KHÔNG CÒN WebM
    // mimeType mặc định là audio/mp4 (M4A)
    return new Promise((resolve, reject) => {
        let parsed;
        try {
            parsed = new URL(directUrl);
        } catch (error) {
            reject(error);
            return;
        }
        
        const protocol = parsed.protocol === 'https:' ? https : http;
        const range = req.headers.range;
        
        const requestHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.youtube.com/',
            'Accept': '*/*'
        };
        
        if (range) {
            requestHeaders['Range'] = range;
        }
        
        // Set headers NGAY LẬP TỨC (trước khi kết nối YouTube) để curl -I nhanh hơn
        // Đặc biệt quan trọng cho HEAD requests (curl -I)
        if (req.method === 'HEAD') {
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            res.setHeader('Content-Type', mimeType); // CHỈ M4A: audio/mp4
            res.status(200);
            res.end();
            resolve();
            return;
        }
        
        const proxyReq = protocol.request({
            hostname: parsed.hostname,
            port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
            path: parsed.pathname + parsed.search,
            method: 'GET',
            headers: requestHeaders
        }, (proxyRes) => {
            if (proxyRes.statusCode === 206) {
                res.status(206);
            } else {
                res.status(proxyRes.statusCode || 200);
            }
            
            // CHỈ TRẢ VỀ M4A (AAC) - Content-Type luôn là audio/mp4
            // Không dùng Content-Type từ YouTube response vì có thể không chính xác
            res.setHeader('Accept-Ranges', proxyRes.headers['accept-ranges'] || 'bytes');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            res.setHeader('Content-Type', mimeType); // CHỈ M4A: audio/mp4
            
            if (proxyRes.headers['content-length']) {
                res.setHeader('Content-Length', proxyRes.headers['content-length']);
            }
            if (proxyRes.headers['content-range']) {
                res.setHeader('Content-Range', proxyRes.headers['content-range']);
            }
            
            proxyRes.pipe(res);
            proxyRes.on('end', resolve);
            proxyRes.on('error', (error) => {
                if (!res.headersSent) {
                    res.status(500).json({ success: false, error: error.message });
                } else {
                    res.end();
                }
                reject(error);
            });
        });
        
        proxyReq.on('error', (error) => {
            reject(error);
        });
        
        proxyReq.end();
    });
}

function runYtDlp(args) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        // Tăng timeout lên 30 giây để đảm bảo có đủ thời gian xử lý
        const process = execFile(YTDLP_PATH, args, { timeout: 30000 }, (error, stdout, stderr) => {
            const elapsed = Date.now() - startTime;
            if (error) {
                const hint = error.code === 'ENOENT'
                    ? 'yt-dlp not found. Please install it or set YTDLP_PATH.'
                    : (error.code === 'ETIMEDOUT' || error.signal === 'SIGTERM')
                    ? `yt-dlp timeout after ${elapsed}ms. Video may not have M4A format available.`
                    : (stderr?.toString() || error.message);
                console.error(`[YouTube API] yt-dlp error after ${elapsed}ms:`, hint);
                return reject(new Error(hint));
            }
            console.log(`[YouTube API] yt-dlp success in ${elapsed}ms`);
            resolve(stdout.toString());
        });
        
        // Log stderr để debug
        if (process.stderr) {
            let stderrData = '';
            process.stderr.on('data', (data) => {
                stderrData += data.toString();
            });
            process.stderr.on('end', () => {
                if (stderrData.trim()) {
                    console.log(`[YouTube API] yt-dlp stderr: ${stderrData.trim().substring(0, 200)}`);
                }
            });
        }
    });
}

// Stream MP3 từ YouTube directUrl + ffmpeg (convert real-time với bitrate tùy chọn)
// Pipeline:
// directUrl (M4A/AAC từ YouTube) -> ffmpeg (transcode to MP3) -> HTTP response
async function streamMp3FromDirectUrl(directUrl, videoId, req, res, bitrateK = 128) {
    return new Promise((resolve, reject) => {
        console.log(`[YouTube API] streamMp3FromDirectUrl: starting MP3 pipeline for ${videoId} at ${bitrateK}kbps`);

        // ffmpeg: đọc trực tiếp từ URL YouTube (M4A/AAC) và convert sang MP3
        const ffArgs = [
            '-nostdin',
            '-loglevel', 'error',
            '-i', directUrl,
            '-vn',
            '-acodec', 'libmp3lame',
            '-b:a', `${bitrateK}k`,
            '-ar', '44100',
            '-ac', '2',
            '-f', 'mp3',
            'pipe:1'
        ];

        let ffmpegProcess;
        let headersSent = false;
        let totalBytes = 0;

        try {
            ffmpegProcess = spawn(FFMPEG_PATH, ffArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
        } catch (error) {
            console.error('[YouTube API] Failed to spawn ffmpeg:', error.message);
            return reject(new Error('ffmpeg spawn failed'));
        }

        // Khi có data MP3 đầu tiên từ ffmpeg, gửi header và stream ra client
        ffmpegProcess.stdout.on('data', (chunk) => {
            totalBytes += chunk.length;
            if (!headersSent) {
                headersSent = true;
                res.writeHead(200, {
                    'Content-Type': 'audio/mpeg',
                    'Accept-Ranges': 'bytes',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=3600',
                });
                console.log(`[YouTube API] MP3 stream started for ${videoId} (${bitrateK}kbps)`);
            }
            if (!res.destroyed) {
                res.write(chunk);
            }
        });

        ffmpegProcess.stdout.on('end', () => {
            if (!res.destroyed) {
                res.end();
            }
            console.log(`[YouTube API] MP3 stream ended for ${videoId}, total bytes: ${totalBytes}`);
            resolve();
        });

        // Error handling
        ffmpegProcess.on('error', (error) => {
            console.error('[YouTube API] ffmpeg process error:', error.message);
            if (!res.headersSent && !res.destroyed) {
                res.status(500).json({ success: false, error: 'ffmpeg process error' });
            } else if (!res.destroyed) {
                res.end();
            }
            reject(error);
        });

        ffmpegProcess.stderr.on('data', (data) => {
            const msg = data.toString();
            console.log(`[YouTube API] ffmpeg stderr (${videoId}): ${msg.trim()}`);
        });

        // Cleanup khi client đóng kết nối
        const cleanup = () => {
            if (ffmpegProcess && !ffmpegProcess.killed) ffmpegProcess.kill();
        };

        req.on('close', cleanup);
        req.on('aborted', cleanup);
    });
}

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`YouTube MP3/MP4 API Server running on http://0.0.0.0:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Documentation: See README.md`);
    
    // Signal PM2 that app is ready (if running under PM2)
    if (process.send) {
        process.send('ready');
    }
});

// Error handling
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use!`);
        console.error('Please change PORT in ecosystem.config.js or stop the process using this port');
    } else {
        console.error('Server error:', error);
    }
    process.exit(1);
});

