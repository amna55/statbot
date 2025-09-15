import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));

app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Store chat sessions
const chatSessions = new Map();

// List of possible model names to try
const MODEL_NAMES = [
    "gemini-pro",
    "gemini-1.0-pro",
    "gemini-1.5-pro",
    "models/gemini-pro",
    "models/gemini-1.0-pro",
    "models/gemini-1.5-pro"
];

async function getAvailableModel() {
    for (const modelName of MODEL_NAMES) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            // Test with a simple request
            const result = await model.generateContent("Hello");
            const response = await result.response;
            console.log(`✅ Using model: ${modelName}`);
            return modelName;
        } catch (error) {
            console.log(`❌ Model ${modelName} not available: ${error.message}`);
            continue;
        }
    }
    throw new Error("No available Gemini models found");
}

// Function to simulate streaming by splitting text into chunks
function simulateStreaming(text, res, chunkSize = 3) {
    const words = text.split(' ');
    let index = 0;

    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (index >= words.length) {
                clearInterval(interval);
                resolve();
                return;
            }

            const chunk = words.slice(index, index + chunkSize).join(' ') + ' ';
            res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
            index += chunkSize;
        }, 50); // 50ms delay between chunks
    });
}

app.get("/api/gemini/stream", async (req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
    });

    const message = req.query.msg?.toString();
    const sessionId = req.query.sessionId || "default";

    if (!message) {
        res.write(`data: ${JSON.stringify({ error: "Message required" })}\n\n`);
        res.write("data: [DONE]\n\n");
        return res.end();
    }

    try {
        // Get available model
        const modelName = await getAvailableModel();
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                maxOutputTokens: 500,
                temperature: 0.7,
            },
        });

        // Get or create chat session
        let chat = chatSessions.get(sessionId);
        if (!chat) {
            chat = model.startChat({
                history: [],
                generationConfig: {
                    maxOutputTokens: 500,
                    temperature: 0.7,
                },
            });
            chatSessions.set(sessionId, chat);
        }

        // Use non-streaming approach (sendMessage instead of sendMessageStream)
        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        if (text && text.trim()) {
            // Simulate streaming by sending text in chunks
            await simulateStreaming(text, res);
        } else {
            res.write(`data: ${JSON.stringify({ text: "Sorry, I don't have an answer for that." })}\n\n`);
        }

        res.write("data: [DONE]\n\n");
        res.end();

    } catch (error) {
        console.error("Error:", error);
        res.write(`data: ${JSON.stringify({ error: error.message || "An error occurred while processing your request" })}\n\n`);
        res.write("data: [DONE]\n\n");
        res.end();
    }
});

// Alternative simple endpoint without streaming
app.get("/api/gemini/simple", async (req, res) => {
    const message = req.query.msg?.toString();
    const sessionId = req.query.sessionId || "default";

    if (!message) {
        return res.status(400).json({ error: "Message required" });
    }

    try {
        const modelName = await getAvailableModel();
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                maxOutputTokens: 500,
                temperature: 0.7,
            },
        });

        let chat = chatSessions.get(sessionId);
        if (!chat) {
            chat = model.startChat({
                history: [],
                generationConfig: {
                    maxOutputTokens: 500,
                    temperature: 0.7,
                },
            });
            chatSessions.set(sessionId, chat);
        }

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        res.json({
            text: text || "Sorry, I don't have an answer for that.",
            sessionId
        });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error.message || "An error occurred" });
    }
});

// Clear chat history endpoint
app.post("/api/gemini/clear", (req, res) => {
    const sessionId = req.query.sessionId || "default";
    chatSessions.delete(sessionId);
    res.json({ message: "Chat history cleared", sessionId });
});

// Get available models endpoint
app.get("/api/gemini/models", async (req, res) => {
    try {
        const models = [];
        for (const modelName of MODEL_NAMES) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("test");
                const response = await result.response;
                models.push({ name: modelName, status: "available" });
            } catch (error) {
                models.push({ name: modelName, status: "unavailable", error: error.message });
            }
        }
        res.json({ models });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        message: "Gemini server is running",
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`✅ Gemini server running at http://localhost:${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📋 Available models: http://localhost:${PORT}/api/gemini/models`);
    console.log(`💬 Simple chat: http://localhost:${PORT}/api/gemini/simple?msg=Hello`);
});