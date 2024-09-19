const path = require('path');
const fs = require('fs');
const axios = require('axios');
const SoundCloud = require('soundcloud-scraper');
const apiKeyPath = path.join(__dirname, 'system', 'apikey.txt');

exports.config = {
    name: "soundcloud",
    version: "1.0.0",
    description: "Search music from SoundCloud and send it as an attachment.",
    category: "tools",
    author: "Kenneth Panio",
    aliases: ['play', 'sing', 'song', 'kanta', 'spotify', 'lyrics', 'lyric', 'lyrist', 'music', 'sc'],
    usage: ['/soundcloud?query=suzume'],
};

const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15",
    "Mozilla/5.0 (Linux; Android 9; SM-G960F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.6 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 10; Pixel 3 XL) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Mobile Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15"
];
exports.initialize = async function ({ req, res }) {
    const musicName = req.query.query || '';

    if (!musicName) {
        return res.status(400).json({ message: "Please provide the title of the music!" });
    }

    try {
        let apiKey = fs.existsSync(apiKeyPath) ? fs.readFileSync(apiKeyPath, 'utf8').trim() : await SoundCloud.keygen();
        if (!fs.existsSync(apiKeyPath)) {
            fs.mkdirSync(path.dirname(apiKeyPath), { recursive: true });
            fs.writeFileSync(apiKeyPath, apiKey);
        }

        const client = new SoundCloud.Client(apiKey);
        const searchResults = await client.search(musicName, 'track');

        if (!searchResults.length) {
            return res.status(404).json({ message: "Can't find the music you're looking for." });
        }

        const song = searchResults[0];
        const songInfo = await client.getSongInfo(song.url);

        let lyrics = "Lyrics not found";
        try {
            const lyricsResponse = await axios.get(atob(`aHR0cHM6Ly9seXJpc3QudmVyY2VsLmFwcC9hcGkv`) + encodeURIComponent(musicName), {
                headers: { 'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)] }
            });
            lyrics = lyricsResponse.data.lyrics || "Lyrics not available";
        } catch (error) {
            console.log("Error fetching lyrics:", error.message);
        }

        res.json({
            title: songInfo.title,
            lyrics: lyrics,
            audio: song.url,
            thumbnail: songInfo.thumbnail
        });

    } catch (error) {
        if (error.message.includes('Invalid ClientID')) {
            const newKey = await SoundCloud.keygen();
            fs.writeFileSync(apiKeyPath, newKey);
            res.status(500).json({ message: 'New API key generated. Please retry the search!' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
};