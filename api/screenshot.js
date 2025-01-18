const axios = require("axios");
const fs = require("fs");
const path = require("path");

exports.config = {
    name: "screenshot",
    category: "tools",
    aliases: ["thumbnail", "capture"],
    info: "Fetch a full-page screenshot of a given URL, save it locally, send it to the client, and then delete it.",
    usage: ["/screenshot?url=https://example.com"],
    author: "Kenneth Panio",
};

// Fetch and save the screenshot
const fetchAndSaveScreenshot = async (url, filePath) => {
    try {
        const thumUrl = `https://image.thum.io/get/width/1920/crop/400/fullpage/noanimate/${encodeURIComponent(url)}`;
        const response = await axios({
            url: thumUrl,
            method: "GET",
            responseType: "stream",
        });

        // Pipe the stream to a file
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });
    } catch (error) {
        console.error("Screenshot fetch error:", error.message);
        return null;
    }
};

// Initialization Function
exports.initialize = async ({ req, res }) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({
            error: "Missing 'url' query parameter.",
        });
    }

    const fileName = `screenshot-${Date.now()}.png`;
    const filePath = path.join(__dirname, fileName);

    console.log(`📸 Fetching screenshot for URL: ${url}`);
    const isDownloaded = await fetchAndSaveScreenshot(url, filePath);

    if (!isDownloaded) {
        return res.status(500).json({
            error: "Failed to fetch and save screenshot.",
        });
    }

    // Send the file to the client
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error("Error sending file:", err.message);
            return res.status(500).json({ error: "Failed to send screenshot." });
        }

        // Delete the file after sending
        fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
                console.error("Error deleting file:", unlinkErr.message);
            } else {
                console.log(`🗑️ Deleted temporary file: ${fileName}`);
            }
        });
    });
};
