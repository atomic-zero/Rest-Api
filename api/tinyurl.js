const { get } = require("axios");

exports.config = {
    name: "tinyurl",
    category: "tools",
    aliases: ["shorten", "shorturl", "urlshort"],
    info: "Shortens the provided URL",
    usage: ["/tinyurl?url=https://google.com"],
    author: "Kenneth Panio"
};

exports.initialize = async ({ req, res }) => {
    const url = req.query.url;
    const urlRegex = /^(https?:\/\/[^\s/$.?#].[^\s]*)$/i;

    if (!url || !urlRegex.test(url)) {
        return res.status(400).json({ error: !url ? "Please provide a URL to shorten." : "Invalid URL format." });
    }

    try {
        const { data } = await get(`https://tinyurl.com/api-create.php?url=${url}`);
        res.json({ status: true, short: data, author: exports.config.author });
    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response 
            ? `TinyURL API error: ${error.response.statusText}` 
            : "No response from TinyURL API. Please try again later.";

        res.status(status).json({ error: message });
    }
};
