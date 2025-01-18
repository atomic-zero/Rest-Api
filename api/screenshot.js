const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Valid URL regex to ensure it starts with http:// or https://
const urlRegex = /^(https?:\/\/)([a-z0-9-]+\.)+[a-z]{2,6}\/?$/i;

exports.config = {
    name: "screenshot",
    category: "tools",
    aliases: ["thumbnail", "capture"],
    info: "Fetch a full-page screenshot of a given URL, stream it to the client, and delete it after use.",
    usage: ["/screenshot?url=https://example.com"],
    author: "Kenneth Panio",
};

// Fetch and stream the screenshot
const fetchAndStreamScreenshot = async (url, res) => {
    try {
        const thumUrl = `https://image.thum.io/get/width/1920/crop/400/fullpage/noanimate/${encodeURIComponent(url)}`;
        const response = await axios({
            url: thumUrl,
            method: "GET",
            responseType: "stream",
        });

        // Set headers to stream the image as a response
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Content-Disposition", "inline; filename=screenshot.png");

        // Pipe the image stream to the response
        response.data.pipe(res);

        return true;
    } catch (error) {
        console.error("Screenshot fetch error:", error.message);
        return false;
    }
};

// Initialization Function
exports.initialize = async ({ req, res }) => {
    const { url } = req.query;

    // Check if the URL is provided
    if (!url) {
        return res.status(400).json({
            error: "Missing 'url' query parameter.",
        });
    }

    // Validate URL format using regex
    if (!urlRegex.test(url)) {
        return res.status(400).json({
            error: "Invalid URL. Only URLs starting with 'http://' or 'https://' are allowed.",
        });
    }

    console.log(`📸 Fetching screenshot for URL: ${url}`);
    const isStreamed = await fetchAndStreamScreenshot(url, res);

    if (!isStreamed) {
        return res.status(500).json({
            error: "Failed to fetch and stream screenshot.",
        });
    }
};
