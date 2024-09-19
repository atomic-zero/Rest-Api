const axios = require('axios');
const randomUseragent = require('random-useragent');

const conversationHistories = {};

exports.config = {
    name: 'ai',
    aliases: ['gpt4om', "gpt4olite"],
    author: '1.0.0',
    credits: 'Kenneth Panio',
    description: 'Interact with GPT-4O API.',
    usage: ['/ai?prompt=hello'],
    category: 'artificial-intelligence',
};

exports.initialize = async function ({ req, res }) {
    try {
        const senderID = req.query.senderID || 'default';
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
        const data = {
            messages: [...conversationHistories[senderID], { role: "user", content: query }]
        };

        const response = await axios.post(url, data, { headers });
        let answer = response.data.answer.replace(/\*\*(.*?)\*\*/g, (_, text) => `•${text}•`);

        conversationHistories[senderID].push({ role: "assistant", content: answer });

        const formattedMessage = `💽 | GPT-4O-MINI (Assistant)\n━━━━━━━━━━━━━━━━━━\n${answer}\n━━━━━━━━━━━━━━━━━━\n◉ USE "CLEAR" TO RESET CONVERSATION.`;

        res.json({ message: formattedMessage });
    } catch (error) {
        console.error("Error processing request:", error);

        if (error.response && error.response.status === 403) {
            return res.status(403).json({ error: "Input exceeds token limit! Try reducing input length or use another AI model." });
        }

        res.status(500).json({ error: `No response from the GPT-4O-MINI API. Please try again later. Error: ${error.message}` });
    }
};