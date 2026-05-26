// src/app/page.js
"use client";

import { useState, useEffect, useRef } from "react";

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
function formatText(text) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId] = useState(() => generateId());
  const [isTyping, setIsTyping] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
  // Don't nudge if no conversation started or already finished
  if (messages.length === 0) return;
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role !== "bot") return;

  const timer = setTimeout(async () => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "__inactivity__",
          sessionId,
        }),
      });
      const data = await res.json();
      // Only show nudge if reply is not empty
      if (data.reply && data.reply.trim() !== "") {
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: data.reply, time: new Date(), },
        ]);
      }
    } catch {
      // Silently fail — nudge is not critical
    }
  }, 30000); // 30 seconds of inactivity

  return () => clearTimeout(timer);
}, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input;

    setMessages((prev) => [
  ...prev,
  { role: "user", text: userMessage, time: new Date() },
  ]);

    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: data.reply,
          time: new Date(),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Something went wrong. Please try again.",
          time: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={styles.outerWrapper}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap');

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html, body {
          overflow: hidden;
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-thumb {
          background: #b2dfdb;
          border-radius: 999px;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }

          40% {
            transform: translateY(-5px);
            opacity: 1;
          }
        }

        .message {
          animation: fadeUp 0.25s ease;
        }

        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #00897B;
          display: inline-block;
          animation: bounce 1.2s infinite ease-in-out;
        }

        .typing-dot:nth-child(2) {
          animation-delay: 0.15s;
        }

        .typing-dot:nth-child(3) {
          animation-delay: 0.3s;
        }

        .send-btn {
          transition: all 0.2s ease;
        }

        .send-btn:hover:not(:disabled) {
          transform: scale(1.05);
          background: #00695C !important;
        }

        .chip {
          transition: all 0.2s ease;
        }

        .chip:hover {
          background: #00897B !important;
          color: white !important;
          border-color: #00897B !important;
        }

        @media (max-width: 768px) {
          .desktop-container {
            border-radius: 0 !important;
            border-left: none !important;
            border-right: none !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      <div style={styles.page} className="desktop-container">
        {/* Header */}

        <header style={styles.header}>
          <div style={styles.logoSection}>
            <img
              src="https://sagefarm.in/wp-content/uploads/2025/02/cropped-Sagefarm-FINAL-TM-Garet-Bold-Garet-light-300dpi.png"
              alt="Sagefarm"
              style={styles.logo}
            />
          </div>

          <div style={styles.statusContainer}>
            <div style={styles.onlineDot} />
            <span style={styles.statusText}>
              Wealth Advisor • Online
            </span>
          </div>
        </header>

        {/* Chat Area */}

        <div style={styles.chatArea}>
          {messages.length === 0 && (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🌿</div>

              <h1 style={styles.title}>
                Your Wealth Planning Journey Starts Here
              </h1>

              <p style={styles.subtitle}>
                Get a personalised SIP plan, risk profile &
                investment roadmap — in under 5 minutes.
              </p>

              <div style={styles.chipContainer}>
                {[
                  "Say hi to start 👋",
                  "How does this work?",
                  "What is SIP?",
                ].map((chip) => (
                  <button
                    key={chip}
                    className="chip"
                    style={styles.chip}
                    onClick={async () => {
  if (isTyping) return;

  setMessages((prev) => [
    ...prev,
    { role: "user", text: chip },
  ]);
  setIsTyping(true);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: chip, sessionId }),
    });
    const data = await res.json();
    setMessages((prev) => [
      ...prev,
      { role: "bot", text: data.reply, time: new Date(),},
    ]);
  } catch {
    setMessages((prev) => [
      ...prev,
      { role: "bot", text: "Something went wrong. Please try again.", time: new Date(), },
    ]);
  } finally {
    setIsTyping(false);
  }
}}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <div style={styles.badges}>
                <div style={styles.badge}>🏆 AMFI Registered</div>
                <div style={styles.badge}>🔒 100% Confidential</div>
                <div style={styles.badge}>⚡ 5 Min Plan</div>
              </div>
            </div>
          )}

          {/* Messages */}

          {messages.map((msg, index) => (
            <div
              key={index}
              className="message"
              style={{
                ...styles.messageRow,
                justifyContent:
                  msg.role === "user"
                    ? "flex-end"
                    : "flex-start",
              }}
            >
              {msg.role === "bot" && (
                <div style={styles.botAvatar}>
                  🌿
                </div>
              )}

              <div
                style={
                  msg.role === "user"
                    ? styles.userBubble
                    : styles.botBubble
                }
              >
                {msg.text.split("\n").map((line, index) => (
                <span key={index}>
                {formatText(line)}
                <br />
                </span>
                ))}

                <div style={styles.time}>
                  {(msg.time || new Date()).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* Typing */}

          {isTyping && (
            <div
              style={{
                ...styles.messageRow,
                justifyContent: "flex-start",
              }}
            >
              <div style={styles.botAvatar}>
                🌿
              </div>

              <div style={styles.typingBubble}>
                <span className="typing-dot" />
                <span
                  className="typing-dot"
                  style={{ margin: "0 4px" }}
                />
                <span className="typing-dot" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}

        <div
          style={{
            ...styles.inputSection,
            boxShadow: inputFocused
              ? "0 -4px 20px rgba(0,137,123,0.10)"
              : "0 -2px 10px rgba(0,0,0,0.04)",
          }}
        >
          <div style={styles.inputWrapper}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Type your message..."
              value={input}
              disabled={isTyping}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              style={styles.input}
            />

            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              style={{
                ...styles.sendButton,
                opacity:
                  !input.trim() || isTyping
                    ? 0.5
                    : 1,
              }}
            >
              ➤
            </button>
          </div>

          <div style={styles.footerText}>
            Sagefarm • AMFI Registered MFD • ARN–318120 •
            For guidance only, not financial advice
          </div>
        </div>
      </div>
    </div>
  );
}

const TEAL = "#00897B";
const TEAL_DARK = "#00695C";
const TEAL_LIGHT = "#E0F2F1";
const WHITE = "#FFFFFF";
const OFF_WHITE = "#F7FAFA";
const TEXT_DARK = "#1C2B2A";
const TEXT_MID = "#5F7471";
const BORDER = "#E4ECEA";

const styles = {
  outerWrapper: {
    width: "100%",
    height: "100dvh",
    background: "#EEF5F4",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  },

  page: {
    width: "100%",
    maxWidth: "1250px",
    height: "100%",
    background: OFF_WHITE,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    borderRadius: "24px",
    border: `1px solid ${BORDER}`,
    boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
    fontFamily: "'DM Sans', sans-serif",
  },

  header: {
    height: "72px",
    background: WHITE,
    borderBottom: `1px solid ${BORDER}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 28px",
    flexShrink: 0,
  },

  logoSection: {
    display: "flex",
    alignItems: "center",
  },

  logo: {
    height: "38px",
    objectFit: "contain",
  },

  statusContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  onlineDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#4CAF50",
    boxShadow: "0 0 10px rgba(76,175,80,0.5)",
  },

  statusText: {
    fontSize: "13px",
    color: TEXT_MID,
    fontWeight: "600",
  },

  chatArea: {
    flex: 1,
    overflowY: "auto",
    padding: "30px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  emptyState: {
    margin: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    maxWidth: "700px",
  },

  emptyIcon: {
    width: "90px",
    height: "90px",
    borderRadius: "50%",
    background: TEAL_LIGHT,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "48px",
    marginBottom: "24px",
  },

  title: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "42px",
    lineHeight: "1.2",
    marginBottom: "16px",
    color: TEXT_DARK,
  },

  subtitle: {
    fontSize: "17px",
    lineHeight: "1.8",
    color: TEXT_MID,
    maxWidth: "600px",
    marginBottom: "28px",
  },

  chipContainer: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: "24px",
  },

  chip: {
    border: `1.5px solid ${TEAL}`,
    background: WHITE,
    color: TEAL,
    borderRadius: "999px",
    padding: "12px 18px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },

  badges: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "center",
  },

  badge: {
    background: TEAL_LIGHT,
    color: TEAL_DARK,
    padding: "8px 14px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
  },

  messageRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: "10px",
  },

  botAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: TEAL_LIGHT,
    border: `1px solid ${TEAL}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
  },

  userBubble: {
    background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DARK})`,
    color: WHITE,
    padding: "14px 18px",
    borderRadius: "20px 20px 4px 20px",
    maxWidth: "70%",
    lineHeight: "1.7",
    fontSize: "15px",
    boxShadow: "0 4px 12px rgba(0,137,123,0.20)",
  },

  botBubble: {
    background: WHITE,
    color: TEXT_DARK,
    padding: "14px 18px",
    borderRadius: "20px 20px 20px 4px",
    maxWidth: "70%",
    lineHeight: "1.7",
    fontSize: "15px",
    border: `1px solid ${BORDER}`,
  },

  typingBubble: {
    background: WHITE,
    padding: "16px 18px",
    borderRadius: "20px 20px 20px 4px",
    border: `1px solid ${BORDER}`,
  },

  time: {
    marginTop: "6px",
    fontSize: "10px",
    opacity: 0.5,
    textAlign: "right",
  },

  inputSection: {
    background: WHITE,
    borderTop: `1px solid ${BORDER}`,
    padding: "18px 24px 16px",
    transition: "all 0.2s ease",
  },

  inputWrapper: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },

  input: {
    flex: 1,
    height: "52px",
    borderRadius: "999px",
    border: `1.5px solid ${BORDER}`,
    background: OFF_WHITE,
    padding: "0 20px",
    fontSize: "15px",
    outline: "none",
    color: TEXT_DARK,
  },

  sendButton: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    border: "none",
    background: TEAL,
    color: WHITE,
    fontSize: "20px",
    cursor: "pointer",
  },

  footerText: {
    marginTop: "10px",
    textAlign: "center",
    fontSize: "11px",
    color: TEXT_MID,
    opacity: 0.7,
  },
};