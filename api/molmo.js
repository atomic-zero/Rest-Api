
const axios = require("axios");

exports.config = {
  name: "molmo",
  aliases: ["flux"],
  category: "tools",
  author: "Kenneth Panio",
  info: "Generates image using flux model from molmo provider",
  usage: ["/molmo?prompt=chatbox%20logo"]
};

exports.initialize = async (req, res) => {
  const prompt = req.query.prompt;
  if (!prompt) {
    return res.status(400).json({ error: "Please provide a prompt to generate an image. e.g: cat!" });
  }

  try {
    const response = await axios.post('https://molmo.org/api/generateImg', { prompt }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Infinix X669 Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.40 Mobile Safari/537.36',
        'Referer': 'https://molmo.org/dashboard'
      }
    });

    const imageUrl = response.data;
    if (!imageUrl) {
      return res.status(503).json({ error: "Image Generation Temporarily Unavailable!" });
    }

    res.json({ status: true, img_url: imageUrl, author: exports.config.author });
  } catch (error) {
    const statusCode = error.response ? error.response.status : 500;
    const errorMessage = error.response ? (error.response.data.error || "An error occurred") : `Failed to generate image: ${error.message}`;
    const errorMessages = {
      400: "Bad Request",
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not Found",
      500: "Internal Server Error",
      503: "Service Unavailable"
    };

    const message = errorMessages[statusCode] || `Error ${statusCode}`;
    res.status(statusCode).json({ error: `${message}: ${errorMessage}` });
  }
};
