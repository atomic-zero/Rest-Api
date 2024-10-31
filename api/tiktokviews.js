
const axios = require('axios');
const randomUseragent = require('random-useragent');

exports.config = {
  name: "tiktokviews",
  aliases: ["boostviews", "viewsboost", "tiktokboost"],
  usage: ["/tiktokviews?username=atomicslashtv&link=https://vt.tiktok.com/ZSj2v71Bn/"],
  info: "Boost TikTok views for a given username and link.",
  category: "tools",
  author: "Kenneth Panio"
};

const generateRandomEmail = () => {
  return `whisper${Math.floor(Math.random() * 900000) + 100000}@gmail.com`;
};

const createHeaders = () => {
  return {
    "Host": "api.likesjet.com",
    "content-length": "137",
    "sec-ch-ua": "\"Google Chrome\";v=\"119\", \"Chromium\";v=\"119\", \"Not?A_Brand\";v=\"24\"",
    "accept": "application/json, text/plain, */*",
    "content-type": "application/json",
    "sec-ch-ua-mobile": "?1",
    "user-agent": randomUseragent.getRandom(),
    "sec-ch-ua-platform": "\"Android\"",
    "origin": "https://likesjet.com",
    "sec-fetch-site": "same-site",
    "sec-fetch-mode": "cors",
    "sec-fetch-dest": "empty",
    "referer": "https://likesjet.com/",
    "accept-language": "en-XA,en;q=0.9,ar-XB;q=0.8,ar;q=0.7,en-GB;q=0.6,en-US;q=0.5"
  };
};

const boostViews = async (username, link) => {
  const email = generateRandomEmail();
  const headers = createHeaders();

  try {
    const response = await axios.post('https://api.likesjet.com/freeboost/3', {
      link: link,
      tiktok_username: username,
      email: email
    }, { headers: headers });

    return { success: true, data: response.data };
  } catch (error) {
    const statusCode = error.response ? error.response.status : 500;
    const errorMessage = error.response ? (error.response.data.error || error.response.statusText || "An error occurred") : `Request setup error: ${error.message}`;
    return { success: false, statusCode, error: errorMessage };
  }
};

exports.initialize = async ({ req, res }) => {
  const { username, link } = req.query;

  if (!username || !link) {
    return res.status(400).json({ error: 'Please provide both username and link.' });
  }

  const result = await boostViews(username, link);

  if (result.success) {
    res.json({
      status: true,
      message: `Successfully boosted views for ${username}.`,
      data: result.data,
      author: exports.config.author
    });
  } else {
    res.status(result.statusCode).json({ error: `An error occurred while boosting views: ${result.error}` });
  }
};
