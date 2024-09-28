const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const { HarmBlockThreshold, HarmCategory } = require("@google/generative-ai");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const conversationHistories = {};

exports.config = {
    name: "gemini",
    version: "1.0.0",
    author: "Kenneth Panio",
    category: "ai",
    info: "Interact with Gemini AI with image recognition.",
    usage: [`/gemini?prompt=hello&model=gemini-1.5-flash&uid=${Date.now()}&image_url=&roleplay=`],
};

async function waitForFilesActive(files, fileManager) {
    console.log("Waiting for file processing...");
    for (const file of files) {
        let fileStatus = await fileManager.getFile(file.name);
        while (fileStatus.state === "PROCESSING") {
            process.stdout.write(".");
            await new Promise((resolve) => setTimeout(resolve, 10000));
            fileStatus = await fileManager.getFile(file.name);
        }
        if (fileStatus.state !== "ACTIVE") {
            throw new Error(`File ${file.name} failed to process`);
        }
    }
    console.log("\nAll files ready.");
}

exports.initialize = async function ({ req, res, font, hajime }) {
    const { key, models } = hajime.api.workers.google;
    const senderID = req.query.uid || 'default';
    const query = req.query.prompt;
    const model = req.query.model || models.gemini[0];
    const imageUrl = req.query.image_url || null;
    const behavior = req.query.roleplay || null;
    const api_key = req.query.key || atob(key);

    const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE }
    ];

    const genAI = new GoogleGenerativeAI(api_key);
    const fileManager = new GoogleAIFileManager(api_key);

    const modelConfig = {
        model: model,
        safetySettings
    };

    if (behavior) {
        modelConfig.systemInstruction = behavior;
    }

    const modelInstance = genAI.getGenerativeModel(modelConfig);
    const cacheFolderPath = path.join(__dirname, "cache");

    if (!conversationHistories[senderID]) {
        conversationHistories[senderID] = [];
    }

    const history = conversationHistories[senderID];

    if (['clear', 'reset', 'forgot', 'forget'].includes(query.toLowerCase())) {
        conversationHistories[senderID] = [];
        res.json({ message: "Conversation history cleared." });
        return;
    }

    let fileData = null;

    async function processAttachment(content) {
        try {
            if (!fs.existsSync(cacheFolderPath)) fs.mkdirSync(cacheFolderPath);
            
            const response = await axios.get(content, { responseType: 'arraybuffer' });
            const mimeType = response.headers['content-type'];
            const fileExtension = mimeType.split('/')[1];
            const filePath = path.join(cacheFolderPath, `file_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExtension}`);
            
            fs.writeFileSync(filePath, response.data);
            
            const uploadResponse = await fileManager.uploadFile(filePath, { mimeType, displayName: `Attachment ${Date.now()}` });
            await waitForFilesActive([uploadResponse.file], fileManager);
            
            return { mimeType, fileUri: uploadResponse.file.uri };
        } catch (error) {
            res.status(500).json({ error: `Failed to process the file: ${error.message}` });
            return null;
        }
    }

    const linkRegex = /https?:\/\/[^\s]+(\.pdf|\.jpg|\.jpeg|\.png|\.mp3|\.mp4)/i;
    const linkMatch = query.match(linkRegex);

    if (linkMatch || imageUrl) {
        const content = imageUrl || linkMatch[0];
        fileData = await processAttachment(content);
    }

    if (!query) {
        res.status(400).json({ error: "Please provide a question or attachment!" });
        return;
    }

    history.push({ role: "user", parts: [{ text: query }] });

    try {
        const chatSession = modelInstance.startChat({
            history: [
                ...history,
                fileData ? {
                    role: "user",
                    parts: [{
                        fileData: {
                            mimeType: fileData.mimeType,
                            fileUri: fileData.fileUri
                        }
                    }]
                } : null,
                { role: "user", parts: [{ text: query }] }
            ].filter(Boolean)
        });

        const result = await chatSession.sendMessage(query);
        const answer = result.response.text().replace(/\*\*(.*?)\*\*/g, (_, text) => font.bold(text));

        history.push({ role: "model", parts: [{ text: answer }] });

        res.json({ message: answer, author: exports.config.author });
    } catch (error) {
        res.status(500).json({ error: `Failed to process your request: ${error.message}` });
    }
};