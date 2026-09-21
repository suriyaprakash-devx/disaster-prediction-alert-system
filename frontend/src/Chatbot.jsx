import { useEffect, useRef, useState } from "react";
import "./Chatbot.css";

const API_URL = "http://127.0.0.1:5000";

function Chatbot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content:
        "Hello! 👋 I am your AI Disaster Management Assistant.\n\nI can help you with floods, cyclones, heatwaves, emergency kits, evacuation, disaster preparedness, and safety.\n\nHow can I help you today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // ============================================================
  // AUTO SCROLL
  // ============================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // ============================================================
  // FOCUS INPUT
  // ============================================================

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // ============================================================
  // QUICK QUESTIONS
  // ============================================================

  const quickQuestions = [
    "What should I keep in an emergency kit?",
    "What should I do during a flood?",
    "How can I stay safe during a cyclone?",
    "What should I do during a heatwave?",
    "How do I prepare for an earthquake?",
    "What should I do during heavy rainfall?",
  ];

  // ============================================================
  // GENERATE MESSAGE ID
  // ============================================================

  const createId = () => {
    return Date.now() + Math.random();
  };

  // ============================================================
  // SEND MESSAGE
  // ============================================================

  const sendMessage = async (customMessage = null) => {
    const messageText =
      customMessage !== null
        ? customMessage.trim()
        : input.trim();

    if (!messageText || loading) {
      return;
    }

    // Add user message
    const userMessage = {
      id: createId(),
      role: "user",
      content: messageText,
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    setInput("");
    setLoading(true);

    try {
      console.log("Sending chat request:", messageText);

      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
        }),
      });

      console.log(
        "Chat response status:",
        response.status
      );

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "Backend returned an invalid response."
        );
      }

      console.log("Chat response:", data);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Server error: ${response.status}`
        );
      }

      // ========================================================
      // SUPPORT DIFFERENT BACKEND RESPONSE FORMATS
      // ========================================================

      const aiResponse =
        data?.response ??
        data?.answer ??
        data?.message ??
        data?.content ??
        data?.reply ??
        "";

      if (
        typeof aiResponse !== "string" ||
        !aiResponse.trim()
      ) {
        throw new Error(
          "Groq AI returned an empty response."
        );
      }

      const assistantMessage = {
        id: createId(),
        role: "assistant",
        content: aiResponse.trim(),
      };

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);
    } catch (error) {
      console.error(
        "================================"
      );

      console.error(
        "CHATBOT ERROR:",
        error
      );

      console.error(
        "================================"
      );

      setMessages((previous) => [
        ...previous,
        {
          id: createId(),
          role: "error",
          content:
            error.message ||
            "I could not generate a response. Please check that the Flask backend and Groq AI are running.",
        },
      ]);
    } finally {
      setLoading(false);

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  // ============================================================
  // ENTER KEY
  // ============================================================

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      sendMessage();
    }
  };

  // ============================================================
  // HANDLE INPUT
  // ============================================================

  const handleInputChange = (event) => {
    setInput(event.target.value);

    // Auto-grow textarea
    event.target.style.height = "auto";

    const newHeight = Math.min(
      event.target.scrollHeight,
      120
    );

    event.target.style.height =
      `${newHeight}px`;
  };

  // ============================================================
  // QUICK QUESTION
  // ============================================================

  const handleQuickQuestion = (question) => {
    if (loading) {
      return;
    }

    sendMessage(question);
  };

  // ============================================================
  // CLEAR CHAT
  // ============================================================

  const clearChat = () => {
    if (loading) {
      return;
    }

    setMessages([
      {
        id: createId(),
        role: "assistant",
        content:
          "Chat cleared. 👋\n\nHow can I help you with disaster preparedness?",
      },
    ]);

    setInput("");

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // ============================================================
  // COPY RESPONSE
  // ============================================================

  const copyMessage = async (text) => {
    try {
      await navigator.clipboard.writeText(text);

      alert("Response copied!");
    } catch (error) {
      console.error(
        "Copy failed:",
        error
      );
    }
  };

  // ============================================================
  // FORMAT AI MESSAGE
  // ============================================================

  const formatMessage = (text) => {
    if (!text) {
      return null;
    }

    const lines = text.split("\n");

    return lines.map((line, index) => {
      const trimmed = line.trim();

      // Empty line
      if (!trimmed) {
        return (
          <div
            key={index}
            className="chat-empty-line"
          />
        );
      }

      // Markdown heading
      if (
        trimmed.startsWith("### ")
      ) {
        return (
          <h4
            key={index}
            className="chat-markdown-heading"
          >
            {formatInlineText(
              trimmed.substring(4)
            )}
          </h4>
        );
      }

      // Bold heading
      if (
        trimmed.startsWith("**") &&
        trimmed.endsWith("**")
      ) {
        return (
          <div
            key={index}
            className="chat-section-heading"
          >
            {formatInlineText(trimmed)}
          </div>
        );
      }

      // Bullet
      if (
        trimmed.startsWith("- ") ||
        trimmed.startsWith("* ") ||
        trimmed.startsWith("• ")
      ) {
        return (
          <div
            key={index}
            className="chat-bullet"
          >
            <span className="chat-bullet-icon">
              •
            </span>

            <span>
              {formatInlineText(
                trimmed.substring(2)
              )}
            </span>
          </div>
        );
      }

      // Numbered list
      const numberedMatch =
        trimmed.match(
          /^(\d+)[.)]\s+(.*)$/
        );

      if (numberedMatch) {
        return (
          <div
            key={index}
            className="chat-numbered-item"
          >
            <span className="chat-number">
              {numberedMatch[1]}
            </span>

            <span>
              {formatInlineText(
                numberedMatch[2]
              )}
            </span>
          </div>
        );
      }

      // Normal paragraph
      return (
        <div
          key={index}
          className="chat-paragraph"
        >
          {formatInlineText(trimmed)}
        </div>
      );
    });
  };

  // ============================================================
  // INLINE MARKDOWN
  // ============================================================

  const formatInlineText = (text) => {
    const parts = text.split(
      /(\*\*.*?\*\*)/g
    );

    return parts.map((part, index) => {
      if (
        part.startsWith("**") &&
        part.endsWith("**")
      ) {
        return (
          <strong key={index}>
            {part.substring(
              2,
              part.length - 2
            )}
          </strong>
        );
      }

      return part;
    });
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="disaster-chatbot">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="chatbot-header">

        <div className="chatbot-header-left">

          <div className="chatbot-ai-icon">
            🤖
          </div>

          <div className="chatbot-title-area">

            <h2>
              Disaster AI Assistant
            </h2>

            <div className="chatbot-status">

              <span className="status-dot"></span>

              <span>
                AI Assistant Online
              </span>

            </div>

          </div>

        </div>

        <button
          className="chatbot-clear-button"
          onClick={clearChat}
          disabled={loading}
          title="Clear conversation"
        >
          🗑️
        </button>

      </div>


      {/* ======================================================
          MODEL BAR
      ====================================================== */}

      <div className="chatbot-model-bar">

        <span>
          ✨
        </span>

        <span>
          Powered by Groq AI
        </span>

        <span className="model-separator">
          •
        </span>

        <span>
          Disaster Safety Expert
        </span>

      </div>


      {/* ======================================================
          CHAT AREA
      ====================================================== */}

      <div className="chatbot-messages">

        {/* QUICK QUESTIONS */}

        {messages.length === 1 &&
          !loading && (

            <div className="quick-question-section">

              <div className="quick-question-title">
                💡 Quick Questions
              </div>

              <div className="quick-question-grid">

                {quickQuestions.map(
                  (question, index) => (

                    <button
                      key={index}
                      className="quick-question-button"
                      onClick={() =>
                        handleQuickQuestion(
                          question
                        )
                      }
                    >
                      {question}
                    </button>

                  )
                )}

              </div>

            </div>

          )}


        {/* MESSAGES */}

        {messages.map((message) => (

          <div
            key={message.id}
            className={`chat-message-row ${
              message.role === "user"
                ? "chat-user-row"
                : "chat-ai-row"
            }`}
          >

            {/* AI ICON */}

            {message.role !== "user" && (

              <div
                className={`chat-message-avatar ${
                  message.role === "error"
                    ? "chat-error-avatar"
                    : "chat-ai-avatar"
                }`}
              >
                {message.role === "error"
                  ? "⚠️"
                  : "🤖"}
              </div>

            )}


            {/* MESSAGE */}

            <div
              className={`chat-message-content ${
                message.role === "user"
                  ? "chat-user-content"
                  : message.role === "error"
                  ? "chat-error-content"
                  : "chat-ai-content"
              }`}
            >

              <div
                className={`chat-bubble ${
                  message.role === "user"
                    ? "chat-user-bubble"
                    : message.role === "error"
                    ? "chat-error-bubble"
                    : "chat-ai-bubble"
                }`}
              >

                {message.role === "user"
                  ? (
                    <div className="user-message-text">
                      {message.content}
                    </div>
                  )
                  : (
                    <div className="ai-message-text">
                      {formatMessage(
                        message.content
                      )}
                    </div>
                  )}

              </div>


              {/* COPY BUTTON */}

              {message.role ===
                "assistant" && (

                <button
                  className="copy-message-button"
                  onClick={() =>
                    copyMessage(
                      message.content
                    )
                  }
                  title="Copy response"
                >
                  📋 Copy
                </button>

              )}

            </div>


            {/* USER ICON */}

            {message.role === "user" && (

              <div className="chat-message-avatar chat-user-avatar">
                👤
              </div>

            )}

          </div>

        ))}


        {/* ==================================================
            TYPING INDICATOR
        ================================================== */}

        {loading && (

          <div className="chat-message-row chat-ai-row">

            <div className="chat-message-avatar chat-ai-avatar">
              🤖
            </div>

            <div className="chat-message-content">

              <div className="chat-bubble chat-ai-bubble typing-bubble">

                <span className="typing-label">
                  AI is thinking
                </span>

                <span className="typing-dots">

                  <span></span>
                  <span></span>
                  <span></span>

                </span>

              </div>

            </div>

          </div>

        )}

        <div ref={messagesEndRef}></div>

      </div>


      {/* ======================================================
          INPUT
      ====================================================== */}

      <div className="chatbot-input-section">

        <div className="chatbot-input-wrapper">

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about disaster safety..."
            disabled={loading}
            rows={1}
          />

          <button
            className="chatbot-send-button"
            onClick={() => sendMessage()}
            disabled={
              loading ||
              !input.trim()
            }
            title="Send"
          >
            {loading ? "⏳" : "➤"}
          </button>

        </div>


        <div className="chatbot-input-footer">

          <span>
            Press Enter to send
          </span>

          <span>
            Shift + Enter for new line
          </span>

        </div>

      </div>

    </div>
  );
}

export default Chatbot;