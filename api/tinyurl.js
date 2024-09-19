const { get } = require("axios");

exports.config = {
    name: "tinyurl",
    category: "tools",
    aliases: ["shorten", "shorturl", "urlshort"],
    info: "Shortens the provided URL",
    usage: ["/tinyurl?url=https://google.com"]
};

exports.initialize = async ({ req, res }) => {
    const url = req.query.url;
    
    const urlRegex = /^(https?:\/\/[^\s/$.?#].[^\s]*)$/i;

    if (!url) {
        return res.status(400).json({ message: "Please provide a URL to shorten." });
    }

    if (!urlRegex.test(url)) {
        return res.status(400).json({ message: "Invalid URL format. Please provide a valid URL." });
    }

    try {
        const response = await get(`https://tinyurl.com/api-create.php?url=${url}`);
        
        res.json({ short: response.data });
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json({
                message: `TinyURL API responded with an error: ${error.response.statusText}`,
                status: error.response.status,
                details: error.response.data
            });
        } else if (error.request) {
            res.status(500).json({
                message: "No response from TinyURL API. Please try again later.",
                details: error.message
            });
        } else {
            res.status(500).json({
                message: "An error occurred while setting up the request.",
                details: error.message
            });
        }
    }
};