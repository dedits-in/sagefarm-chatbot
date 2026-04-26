// src/app/page.js
"use client";

import { useState, useEffect, useRef } from "react";

function getSessionId() {
  let id = localStorage.getItem("chat_session_id");
  if (!id) {
    id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem("chat_session_id", id);
  }
  return id;
}

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  // Auto-scroll to bottom whenever messages change or typing indicator appears
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim() || !sessionId || isTyping) return;

    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ message: input, sessionId }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Something went wrong. Please try again." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.avatar}>🌿</div>
        <div>
          <div style={styles.headerTitle}>Sagefarm Wealth Advisor</div>
          <div style={styles.headerSub}>
            {isTyping ? "Typing..." : "Online"}
          </div>
        </div>
      </div>

      {/* Chat window */}
      <div style={styles.chatWindow}>
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            🌿 Welcome to <b>Sagefarm</b><br/>
            Say <b>hi</b> to start your wealth planning journey
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.messageRow,
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {msg.role === "bot" && <div style={styles.botAvatar}>🌿</div>}
            <div
              style={
                msg.role === "user" ? styles.userBubble : styles.botBubble
              }
            >
              {/* Preserve newlines from bot messages */}
              {msg.text.split("\n").map((line, j) => (
                <span key={j}>
                  {line}
                  {j < msg.text.split("\n").length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ ...styles.messageRow, justifyContent: "flex-start" }}>
            <div style={styles.botAvatar}>🌿</div>
            <div style={styles.typingBubble}>
              <span style={styles.dot} />
              <span style={{ ...styles.dot, animationDelay: "0.2s" }} />
              <span style={{ ...styles.dot, animationDelay: "0.4s" }} />
            </div>
          </div>
        )}

        {/* Invisible anchor to scroll to */}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={styles.inputBar}>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={isTyping}
        />
        <button
          onClick={sendMessage}
          disabled={isTyping || !input.trim()}
          style={{
            ...styles.sendBtn,
            opacity: isTyping || !input.trim() ? 0.5 : 1,
            cursor: isTyping || !input.trim() ? "not-allowed" : "pointer",
          }}
        >
          Send
        </button>
      </div>

      {/* Bouncing dot animation */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const TEAL = "#00897B";        // Sagefarm primary teal (matches website buttons)
const TEAL_DARK = "#00695C";   // darker teal for hover/header
const TEAL_LIGHT = "#E0F2F1";  // very light teal for bot bubbles

const styles = {
  page: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#F5F7F7",      // off-white page background
    color: "#1a1a1a",
    fontFamily: "'Segoe UI', sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 20px",
    background: TEAL,           // teal header matching website
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  avatar: {
    fontSize: "22px",
    width: "42px",
    height: "42px",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid rgba(255,255,255,0.4)",
  },
  headerTitle: {
    fontWeight: "700",
    fontSize: "16px",
    color: "#ffffff",
  },
  headerSub: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.8)",
    marginTop: "2px",
  },
  chatWindow: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    background: "#F5F7F7",
  },
  emptyState: {
    textAlign: "center",
    color: "#888",
    marginTop: "60px",
    fontSize: "15px",
    lineHeight: "1.6",
  },
  messageRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: "8px",
  },
  botAvatar: {
    fontSize: "18px",
    width: "32px",
    height: "32px",
    background: TEAL,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginBottom: "2px",
  },
  userBubble: {
    background: TEAL,           // user messages in Sagefarm teal
    color: "#ffffff",
    padding: "10px 16px",
    borderRadius: "18px 18px 4px 18px",
    maxWidth: "75%",
    fontSize: "14px",
    lineHeight: "1.6",
    wordBreak: "break-word",
    boxShadow: "0 1px 4px rgba(0,137,123,0.3)",
  },
  botBubble: {
    background: "#ffffff",      // white bot bubbles (clean, like website)
    color: "#1a1a1a",
    padding: "10px 16px",
    borderRadius: "18px 18px 18px 4px",
    maxWidth: "75%",
    fontSize: "14px",
    lineHeight: "1.6",
    border: "1px solid #e0e0e0",
    wordBreak: "break-word",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  typingBubble: {
    background: "#ffffff",
    border: "1px solid #e0e0e0",
    borderRadius: "18px 18px 18px 4px",
    padding: "12px 16px",
    display: "flex",
    gap: "5px",
    alignItems: "center",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  dot: {
    display: "inline-block",
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: TEAL,
    animation: "bounce 1.2s infinite ease-in-out",
  },
  inputBar: {
    display: "flex",
    gap: "10px",
    padding: "16px 20px 24px 20px",
    background: "#ffffff",
    borderTop: "1px solid #e0e0e0",
    boxShadow: "0 -2px 8px rgba(0,0,0,0.05)",
  },
  input: {
    flex: 1,
    padding: "14px 20px",
    borderRadius: "24px",
    border: "2px solid #e0e0e0",
    background: "#F5F7F7",
    color: "#1a1a1a",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
    minWidth: 0,
    transition: "border-color 0.2s",
  },
  sendBtn: {
    padding: "14px 26px",
    background: TEAL,           // teal send button matching website
    color: "white",
    border: "none",
    borderRadius: "24px",
    fontSize: "15px",
    fontWeight: "600",
    flexShrink: 0,
    transition: "opacity 0.2s, background 0.2s",
    cursor: "pointer",
  },
};