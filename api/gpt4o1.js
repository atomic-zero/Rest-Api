const axios = require("axios");

exports.config = {
    name: "ai",
    aliases: ["gpt4o1", "o1", "o1p", "gpt"],
    version: "1.0.0",
    credits: "Kenneth Panio",
    info: "Interact with GPT-4 o1 preview AI with websearch, file generation and image recognition based on image url in query.",
    usage: [`/ai?prompt=generate_a_cat_image&uid=${Date.now}`],
    guide: "ai How does quantum computing work?",
    category: "ai"
};

const conversationHistories = {};

exports.initialize = async ({ req, res, font }) => {
    const senderID = req.query.uid || 'default';
    const query = req.query.prompt;

    if (!query) return res.status(400).json({ error: "No prompt provided" });

    if (['clear', 'reset', 'forgot', 'forget'].includes(query.toLowerCase())) {
        conversationHistories[senderID] = [];
        return res.json({ message: "Conversation history cleared." });
    }

    const history = conversationHistories[senderID] || [];
    history.push({ senderType: "USER", content: query });
    conversationHistories[senderID] = history;

    const baseUrl = "https://markbot-10923.chipp.ai";
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K)',
        'Content-Type': 'application/json',
        'Origin': baseUrl
    };

    const getResponse = async () => axios.post(`${baseUrl}/api/openai/chat`, {
        messageList: history,
        fileIds: [],
        threadId: `thread_${senderID}`
    }, { headers });

    const isImageUrl = async (url) => {
        try {
            const { headers } = await axios.head(url);
            return headers['content-type'].startsWith('image');
        } catch {
            return false;
        }
    };

    let answer = "This Endpoint is Under Maintenance!";
    for (let attempts = 0; attempts < 3; attempts++) {
        try {
            const response = await getResponse();
            answer = response.data.trim();
            history.push({ senderType: "BOT", content: answer });
            break;
        } catch (error) {
            if (attempts === 2) {
                return res.status(500).json({ error: "Service unavailable" });
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempts + 1)));
        }
    }

    const imageUrls = [...answer.matchAll(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/g)]
        .map(([, url]) => url)
        .filter(async (url) => await isImageUrl(url));

    res.json({
        message: answer,
        img_urls: imageUrls
    });
};
