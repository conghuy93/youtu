# YouTube MP3/MP4 API Docker Image
FROM node:20-alpine

# Install yt-dlp and ffmpeg
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    curl \
    && pip3 install --break-system-packages yt-dlp \
    && yt-dlp --version

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create cache directory
RUN mkdir -p /app/cache

# Expose port
EXPOSE 6680

# Set environment variables
ENV NODE_ENV=production
ENV PORT=6680
ENV YTDLP_PATH=yt-dlp
ENV FFMPEG_PATH=ffmpeg

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:6680/health || exit 1

# Run the application
CMD ["node", "server.js"]
