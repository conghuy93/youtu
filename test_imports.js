/**
 * Test imports để kiểm tra dependencies
 */

console.log('=== Testing Imports ===\n');

try {
    console.log('1. Testing express...');
    require('express');
    console.log('   ✅ express OK');
} catch (error) {
    console.log('   ❌ express ERROR:', error.message);
    process.exit(1);
}

try {
    console.log('2. Testing cors...');
    require('cors');
    console.log('   ✅ cors OK');
} catch (error) {
    console.log('   ❌ cors ERROR:', error.message);
    process.exit(1);
}

try {
    console.log('3. Testing ytdl-core...');
    require('ytdl-core');
    console.log('   ✅ ytdl-core OK');
} catch (error) {
    console.log('   ❌ ytdl-core ERROR:', error.message);
    process.exit(1);
}

try {
    console.log('4. Testing youtube-sr...');
    const youtubeSr = require('youtube-sr');
    console.log('   ✅ youtube-sr OK');
    console.log('   Type:', typeof youtubeSr);
    console.log('   Has default:', !!youtubeSr.default);
    console.log('   Has search:', typeof youtubeSr.search === 'function');
    if (youtubeSr.default) {
        console.log('   Default has search:', typeof youtubeSr.default.search === 'function');
    }
} catch (error) {
    console.log('   ❌ youtube-sr ERROR:', error.message);
    process.exit(1);
}

try {
    console.log('5. Testing fs, path, os (built-in)...');
    require('fs');
    require('path');
    require('os');
    console.log('   ✅ Built-in modules OK');
} catch (error) {
    console.log('   ❌ Built-in modules ERROR:', error.message);
    process.exit(1);
}

console.log('\n=== All imports OK ===');
console.log('\nYou can now start the server with:');
console.log('  node server.js');
console.log('  or');
console.log('  pm2 start ecosystem.config.js');







