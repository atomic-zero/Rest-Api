const axios = require("axios");

exports.config = {
    name: "screenshot",
    category: "tools",
    aliases: ["thumbnail", "capture"],
    info: "Stream a full-page screenshot of a given URL.",
    usage: ["/screenshot?url=https://google.com"],
    author: "Kenneth Panio",
};

const fetchScreenshotStream = async (url) => {
    try {
        const thumUrl = `https://image.thum.io/get/width/1920/crop/400/fullpage/noanimate/${encodeURIComponent(url)}`;
        const response = await axios({
            url: thumUrl,
            method: "GET",
            responseType: "stream",
        });
        return response;
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

    const screenshotStream = await fetchScreenshotStream(url);

    if (!screenshotStream) {
        return res.status(500).json({
            error: "Failed to fetch screenshot.",
        });
    }

    res.setHeader("Content-Type", screenshotStream.headers["content-type"]);
    res.setHeader("Content-Disposition", "inline");
    screenshotStream.data.pipe(res);
};
