const axios = require("axios");
const fs = require("fs");
const path = require("path");

exports.config = {
    name: "screenshot",
    category: "tools",
    aliases: ["thumbnail", "capture"],
    info: "Fetch a full-page screenshot of a given URL, stream it to the client, and delete it after use.",
    usage: ["/screenshot?url=https://example.com"],
    author: "Kenneth Panio",
};

const getHeadersForUrl = (url) => {
    const domainPatterns = [{
        domains: ['pixiv.net', 'i.pximg.net'],
        headers: {
            Referer: 'http://www.pixiv.net/'
        }
    },
    {
        domains: ['deviantart.com'],
        headers: {
            Referer: 'https://www.deviantart.com/'
        }
    },
    {
        domains: ['artstation.com'],
        headers: {
            Referer: 'https://www.artstation.com/'
        }
    },
    {
        domains: ['instagram.com'],
        headers: {
            Referer: 'https://www.instagram.com/'
        }
    },
    {
        domains: ['googleusercontent.com'],
        headers: {
            Referer: 'https://images.google.com/'
        }
    },
    {
        domains: ['i.nhentai.net', 'nhentai.net'],
        headers: {
            Referer: 'https://nhentai.net/'
        }
    }];

    const domain = domainPatterns.find(({
        domains
    }) => domains.some(d => url.includes(d)));

    const headers = domain ? {
        ...domain.headers
    } : {};

    if (url.endsWith('.jpg') || url.endsWith('.png')) {
        headers['Accept'] = 'image/webp,image/apng,image/*,*/*;q=0.8';
    }

    return headers;
};

// Download the image and return it as arraybuffer
const download = async (url, responseType = 'arraybuffer', extension = 'png') => {
    try {
        const response = await axios.get(url, {
            responseType,
            headers: getHeadersForUrl(url),
        });

        if (responseType === 'arraybuffer') {
            // Send the image as a stream (no need to save locally)
            return response.data;
        }

        return response.data;
    } catch (error) {
        console.error("Download error:", error.message);
        throw new Error("Failed to download the image.");
    }
};

const fetchAndStreamScreenshot = async (url, res) => {
    try {
        const thumUrl = `https://image.thum.io/get/width/1920/crop/400/fullpage/noanimate/${encodeURIComponent(url)}`;
        
        // Fetch image as arraybuffer (streamable data)
        const imageBuffer = await download(thumUrl, "arraybuffer");

        // Set headers to stream the image as a response
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Content-Disposition", "inline; filename=screenshot.png");

        // Stream the image buffer directly to the response
        res.end(imageBuffer);

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

    // Validate URL format using regex (only http/https)
    const urlRegex = /^(https?:\/\/)([a-z0-9-]+\.)+[a-z]{2,6}\/?$/i;
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
