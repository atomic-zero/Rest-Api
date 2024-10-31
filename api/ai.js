
const axios = require('axios');
const randomUseragent = require('random-useragent');
const conversationHistories = {};

exports.config = {
  name: 'gpt4om',
  aliases: ["gpt4olite"],
  version: '1.0.0',
  author: 'Kenneth Panio',
  info: 'Interact with GPT-4O-Mini Fast & Lite Version.',
  usage: [`/gpt4om?prompt=hello&uid=${Date.now()}`],
  category: 'ai',
};

exports.initialize = async ({ req, res, font }) => {
  const senderID = req.query.uid || Date.now();
  const query = req.query.prompt;

  if (!query) {
    return res.status(400).json({ error: "No prompt provided" });
  }

  if (['clear', 'reset', 'forgot', 'forget'].includes(query.toLowerCase())) {
    conversationHistories[senderID] = [];
    return res.json({ message: "Conversation history cleared." });
  }

  conversationHistories[senderID] = conversationHistories[senderID] || [];
  conversationHistories[senderID].push({ role: "user", content: query });

  const url = 'https://chataibot.ru/api/promo-chat/messages';
  const headers = {
    'Content-Type': 'application/json',
    'Accept-Language': 'ru',
    'User-Agent': randomUseragent.getRandom(),
    'Referer': 'https://chataibot.ru/app/free-chat',
  };
  const data = { messages: conversationHistories[senderID] };

  let retries = 3;
  let errorMessage = "An unexpected error occurred. Please try again later.";

  while (retries > 0) {
    try {
      const response = await axios.post(url, data, { headers });
      const answer = response.data.answer.replace(/\*\*(.*?)\*\*/g, (_, text) => font.bold(text));
      conversationHistories[senderID].push({ role: "assistant", content: answer });
      return res.json({ status: true, message: answer, author: exports.config.author });
    } catch (error) {
      retries -= 1;
      if (retries === 0) {
        const status = error.response?.status || 500;
        const data = error.response?.data;
        const errorMessages = {
          400: "Bad Request. Please check your input and try again.",
          401: "Unauthorized. Authentication failed or was not provided.",
          403: "Forbidden. Input exceeds token limit or access is restricted.",
          404: "Not Found. The requested resource could not be found.",
          500: "Internal Server Error. The server encountered an error.",
        };
        errorMessage = errorMessages[status] || data?.message || errorMessage;
        return res.status(status).json({ error: errorMessage });
      }
    }
  }
};
