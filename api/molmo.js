
const axios = require("axios");

exports.config = {
  name: "molmo",
  aliases: ["flux"],
  version: "1.0.0",
  category: "tools",
  author: "Kenneth Panio",
  info: "Generates image using flux model from molmo provider",
  usage: ["/molmo?prompt=chatbox%20logo"]
};

exports.initialize = async function (req, res) {
  const prompt = req.query.prompt;
  if (!prompt) {
    return res.status(400).send("Please provide a prompt to generate an image. e.g: cat!");
  }

  try {
    const url = 'https://molmo.org/api/generateImg';
    const response = await axios.post(url, { prompt: prompt }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Infinix X669 Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.40 Mobile Safari/537.36',
        'Referer': 'https://molmo.org/dashboard'
      }
    });

    const imageUrl = response.data;
    if (!imageUrl) {
      return res.status(503).send("Image Generation Temporarily Unavailable!");
    }

    res.json({ status: true, img_url: imageUrl, author: exports.config.author });

  } catch (error) {
    res.status(500).send(`Failed to generate image: ${error.message}`);
  }
};
