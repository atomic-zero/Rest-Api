const axios = require("axios");

exports.config = {
    name: "screenshot",
    category: "tools",
    aliases: ["thumbnail", "capture"],
    info: "Fetch a full-page screenshot of a given URL as an image.",
    usage: ["/screenshot?url=https://example.com"],
    author: "Kenneth Panio",
};

const fetchScreenshotBuffer = async (url) => {
    try {
        const thumUrl = `https://image.thum.io/get/width/1920/crop/400/fullpage/noanimate/${encodeURIComponent(url)}`;
        const response = await axios({
            url: thumUrl,
            method: "GET",
            responseType: "arraybuffer",
        });
        return {
            buffer: response.data,
            contentType: response.headers["content-type"],
        };
    } catch (error) {
        console.error("Screenshot fetch error:", error.message);
        return null;
    }
};

exports.initialize = async ({ req, res }) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({
            error: "Missing 'url' query parameter.",
        });
    }

    console.log(`📸 Fetching screenshot for URL: ${url}`);
    const screenshot = await fetchScreenshotBuffer(url);

    if (!screenshot) {
        return res.status(500).json({
            error: "Failed to fetch screenshot.",
        });
    }

    res.setHeader("Content-Type", screenshot.contentType);
    res.setHeader("Content-Disposition", "inline");
    res.send(screenshot.buffer);
};
