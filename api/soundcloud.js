const path = require('path');
const fs = require('fs');
const axios = require('axios');
const SoundCloud = require('soundcloud-scraper');
const apiKeyPath = path.join(__dirname, 'system', 'apikey.txt');

exports.config = {
    name: "music",
    version: "1.0.0",
    description: "Search music from SoundCloud and send it as an attachment.",
    author: "Kenneth Panio",
    aliases: ['play', 'sing', 'song', 'kanta', 'spotify', 'lyrics', 'lyric', 'lyrist', 'soundcloud', 'sc'],
    usage: '[title]',
};

exports.initialize = async function ({ req, res, color }) {
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