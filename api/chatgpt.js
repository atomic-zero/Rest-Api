const { G4F } = require("g4f");
const g4f = new G4F();

exports.config = {
    name: 'chatgpt',
    author: 'Kenneth Panio',
    description: 'Generates a response from ChatGPT',
    category: 'ai',
    usage: ['/chatgpt?prompt=hello']
};

exports.initialize = async function ({ req, res, color }) {
    try {

        const question = req.query.prompt;
        if (!question) {
            return res.status(400).json({ error: "No question provided" });
        }


        const messages = [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: question }
        ];


        const chat = await g4f.chatCompletion(messages);

        res.json({ content: chat });
    } catch (error) {
        console.error(color.red("Error generating response: " + error.message));
        res.status(500).json({ error: "Failed to generate response" });
    }
};
