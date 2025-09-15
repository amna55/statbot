import React, { useState, useRef, useEffect } from "react";
import "./bot.css";
import robot from "../assets/robot.svg";

interface ChatMessage {
    sender: "user" | "ai";
    text: string;
}

const Bot: React.FC = () => {
    const [userInput, setUserInput] = useState("");
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
        {
            sender: "ai",
            text: "Hi! I'm StatBot powered by Gemini 2.5 Flash. Ask me anything about statistics, population, GDP, education, employment, or inflation!",
        },
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory]);

    const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && userInput.trim() !== "") {
            await sendMessage();
        }
    };

    const handleSendClick = async () => {
        if (userInput.trim() !== "") await sendMessage();
    };

    const sendMessage = async () => {
        const userMessage = userInput.trim();
        if (!userMessage) return;

        setUserInput("");
        setLoading(true);
        setError(null);

        // Add user message
        setChatHistory((prev) => [...prev, { sender: "user", text: userMessage }]);
        // Add placeholder AI message
        setChatHistory((prev) => [...prev, { sender: "ai", text: "" }]);

        try {
            const eventSource = new EventSource(
                `http://localhost:5000/api/gemini/stream?msg=${encodeURIComponent(userMessage)}`
            );

            eventSource.onmessage = (event) => {
                if (event.data === "[DONE]") {
                    eventSource.close();
                    setLoading(false);
                    return;
                }

                try {
                    const data = JSON.parse(event.data);
                    if (!data.text) return;

                    setChatHistory((prev) => {
                        const updated = [...prev];
                        const lastMsgIndex = updated.length - 1;
                        if (updated[lastMsgIndex].sender === "ai") {
                            updated[lastMsgIndex] = {
                                ...updated[lastMsgIndex],
                                text: updated[lastMsgIndex].text + data.text,
                            };
                        }
                        return updated;
                    });
                } catch (err) {
                    console.error("Parse error:", err);
                }
            };

            eventSource.onerror = (err) => {
                console.error("Stream error:", err);
                setError("Streaming failed. Please try again.");
                setLoading(false);
                eventSource.close();
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to fetch from backend";
            setError(errorMessage);
            setChatHistory((prev) => [...prev, { sender: "ai", text: `Error: ${errorMessage}` }]);
            setLoading(false);
        }
    };

    return (
        <div className="bot-single-container">
            <div className="bot-top">
                <div className="bot-left">
                    <img src={robot} alt="Robot" className="robot-image" />
                </div>
                <div className="bot-right">
                    <div className="think-box">
                        <p>How can I assist you?</p>
                        <span className="think-arrow"></span>
                    </div>
                </div>
            </div>

            <div className="chat-history">
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.sender === "ai" ? "ai-msg" : "user-msg"}`}>
                        <div className="message-sender">
                            {msg.sender === "user" ? <strong>You: </strong> : <strong>StatBot: </strong>}
                        </div>
                        <div className="message-text">{msg.text}</div>
                    </div>
                ))}

                {loading && (
                    <div className="chat-message ai-msg">
                        <div className="message-sender">
                            <strong>StatBot: </strong>
                        </div>
                        <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}

                <div ref={chatEndRef} />
            </div>

            {error && (
                <div className="error-message">
                    <p>Error: {error}</p>
                </div>
            )}

            <div className="typing-container">
                <input
                    type="text"
                    placeholder="Ask a question..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="typing-input"
                    disabled={loading}
                />
                <button
                    onClick={handleSendClick}
                    className="send-button"
                    disabled={loading || userInput.trim() === ""}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default Bot;
