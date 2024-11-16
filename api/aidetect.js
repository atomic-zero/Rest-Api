
const axios = require('axios');

exports.config = {
  name: "aidetect",
  aliases: ["aicheck", "detectai", "zerogpt", "gptzero"],
  usage: ["/aidetect?text=helloWorld!"],
  info: "Detect if the text is AI-generated or human-written.",
  category: "tools",
  author: "Kenneth Panio"
};

exports.initialize = async ({ req, res, font , hajime }) => {
  const detectAI = async (text) => {
    try {
      const response = await axios.post(hajime.api.demo + '/api/detect', { text }, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      });
      return { status: true, data: response.data };
    } catch (error) {
      const statusCode = error.response ? error.response.status : 500;
      const errorMessage = error.response ? (error.response.data.error || error.response.statusText || "An error occurred") : `Request setup error: ${error.message}`;
      return { status: false, statusCode, error: errorMessage };
    }
  };

  const text = font.origin(req.query.text || '').trim();
  if (!text) {
    return res.status(400).json({ error: 'Please provide the text to check.' });
  }

  const result = await detectAI(text);
  if (result.status) {
    const { grade_level, probability_fake, probability_real, readability_score, reading_ease } = result.data;
    const fakePercentage = (probability_fake * 100).toFixed(2);
    const realPercentage = (probability_real * 100).toFixed(2);
    const certaintyMessage = fakePercentage > realPercentage
      ? `The text is ${fakePercentage}% likely to be written by an AI and ${realPercentage}% likely to be written by a human.`
      : `The text is ${realPercentage}% likely to be written by a human and ${fakePercentage}% likely to be written by an AI.`;

    res.json({
      status: true,
      raw_result: result.data,
      cleaned_result: {
        timestamps: Date.now(),
        message: `Detection result: - Grade Level: ${grade_level} - Probability Fake: ${fakePercentage}% - Probability Real: ${realPercentage}% - Readability Score: ${readability_score} - Reading Ease: ${reading_ease || 'N/A'} ${certaintyMessage}`,
        author: exports.config.author
      }
    });
  } else {
    res.status(result.statusCode).json({ error: `An error occurred while detecting the text: ${result.error}` });
  }
};
