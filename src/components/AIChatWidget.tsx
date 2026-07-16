import React, { useState, useRef, useEffect } from "react";
import { X, Send, User, MinusSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Halo! Saya AI Assistant SPI SmartAudit. Ada yang bisa saya bantu hari ini?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [shrinkingIds, setShrinkingIds] = useState<Set<number>>(new Set());
  const prevMessagesRef = useRef<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isMinimized]);

  // Detect when an empty assistant message gets content → trigger shrink-out animation
  useEffect(() => {
    const prev = prevMessagesRef.current;
    messages.forEach((msg, i) => {
      if (msg.role === "assistant" && msg.content !== "" && prev[i]?.content === "") {
        setShrinkingIds(s => new Set(s).add(i));
        // After shrink animation (300ms), remove from set so content appears
        setTimeout(() => {
          setShrinkingIds(s => { const n = new Set(s); n.delete(i); return n; });
        }, 300);
      }
    });
    prevMessagesRef.current = messages;
  }, [messages]);

  // Context Awareness Helper
  const getPageContext = () => {
    const path = window.location.pathname;
    let contextDesc = "Dashboard Utama";
    
    if (path.includes("/kka")) contextDesc = "Daftar Kertas Kerja Audit (KKA)";
    else if (path.includes("/temuan")) contextDesc = "Daftar Temuan Audit";
    else if (path.includes("/rtl")) contextDesc = "Rencana Tindak Lanjut (RTL)";
    else if (path.includes("/surat-tugas")) contextDesc = "Daftar Surat Tugas Audit";
    else if (path.includes("/pkpt")) contextDesc = "Program Kerja Pengawasan Tahunan (PKPT)";
    else if (path.includes("/laporan")) contextDesc = "Laporan Audit";
    
    // Get visible text from main content if possible, limited to 4000 chars to include table data
    let pageContent = "";
    const mainEls = document.getElementsByTagName('main');
    if (mainEls.length > 0) {
       pageContent = mainEls[0].innerText.substring(0, 4000);
    } else {
       pageContent = document.body.innerText.substring(0, 3000);
    }

    return `[SISTEM KONTEKS: Pengguna saat ini berada di halaman '${contextDesc}' (Path: ${path}). Berikut adalah cuplikan konten halaman saat ini:\n"""\n${pageContent}\n"""\nBantu pengguna berdasarkan konteks ini jika relevan.]\n\n`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    
    // If it's the first real user message, inject context
    const isFirstUserMsg = messages.filter(m => m.role === "user").length === 0;
    const promptToSend = isFirstUserMsg ? getPageContext() + userMessage : userMessage;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage }
    ];
    
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("https://spi-smartaudit.fakhriid274.workers.dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToSend,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          stream: true
        }),
      });

      if (!response.ok) throw new Error("Gagal menghubungi server AI");
      if (!response.body) throw new Error("Tidak ada stream");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let assistantMessage = "";
      
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "" }
      ]);
      
      setIsLoading(false); // Enable scrolling/UI while streaming

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && !line.includes("[DONE]")) {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content || "";
              assistantMessage += content;
              setMessages(prev => {
                const newMsg = [...prev];
                newMsg[newMsg.length - 1].content = assistantMessage;
                return newMsg;
              });
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Maaf, terjadi kesalahan saat menghubungi server AI. Silakan coba lagi." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
      }}
    >
      {/* Chat Window */}
      <div
        style={{
          width: 360,
          height: isMinimized ? 60 : 540,
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid #E2E8F0",
          transformOrigin: "bottom right",
          transition: "all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
          transform: isOpen ? "scale(1) translateY(0)" : "scale(0.8) translateY(20px)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          marginBottom: 16,
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #0EA5E9, #0284C7)",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "white",
            cursor: "pointer",
          }}
          onClick={() => setIsMinimized(!isMinimized)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <img src="/ailogo.png" alt="AI" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>SmartAudit AI</h3>
              <p style={{ fontSize: 11, margin: 0, opacity: 0.9 }}>Asisten Cerdas Anda</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
              style={{ background: "transparent", border: "none", color: "white", cursor: "pointer", padding: 4, borderRadius: 4 }}
            >
              <MinusSquare size={18} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              style={{ background: "transparent", border: "none", color: "white", cursor: "pointer", padding: 4, borderRadius: 4 }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Chat Area */}
            <div
              className="custom-scrollbar"
              style={{
                flex: 1,
                padding: 16,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                background: "#F8FAFC",
              }}
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className="chat-msg-animate"
                  style={{
                    display: "flex",
                    flexDirection: msg.role === "user" ? "row-reverse" : "row",
                    gap: 10,
                    alignItems: "flex-end",
                  }}
                >
                  {/* LEFT: Avatar or Loading Circle */}
                  {(msg.role === "assistant" && msg.content === "") || shrinkingIds.has(i) ? (
                    // Loading state: grow-in circle, then shrink-out when content arrives
                    <div
                      className={shrinkingIds.has(i) ? "ai-loading-shrink" : "ai-loading-circle"}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        border: "2.5px solid #0EA5E9",
                        background: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      <video
                        src="/loading.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        style={{ width: 56, height: 56, objectFit: "cover", borderRadius: "50%" }}
                      />
                    </div>
                  ) : (
                    <>
                      {/* Normal avatar */}
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: msg.role === "user" ? "#0284C7" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          overflow: "hidden",
                        }}
                      >
                        {msg.role === "user" ? <User size={14} color="white" /> : <img src="/ailogo.png" alt="AI" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />}
                      </div>

                      {/* Bubble */}
                      <div style={{ position: "relative", maxWidth: "75%" }}>
                        <div
                          className="chat-markdown"
                          style={{
                            padding: "10px 14px",
                            borderRadius: 16,
                            borderBottomRightRadius: msg.role === "user" ? 4 : 16,
                            borderBottomLeftRadius: msg.role === "assistant" ? 4 : 16,
                            background: msg.role === "user" ? "#0EA5E9" : "white",
                            color: msg.role === "user" ? "white" : "#1E293B",
                            fontSize: 13.5,
                            lineHeight: 1.5,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                            border: msg.role === "assistant" ? "1px solid #E2E8F0" : "none",
                            whiteSpace: "normal",
                          }}
                        >
                          <div className="ai-loading-appear">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        </div>
                        {/* Copy Button — only for assistant messages with content */}
                        {msg.role === "assistant" && msg.content !== "" && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(msg.content);
                              setCopiedId(i);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            title="Salin pesan"
                            style={{
                              position: "absolute",
                              bottom: -24,
                              left: 4,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: copiedId === i ? "#16A34A" : "#94A3B8",
                              fontSize: 11,
                              padding: "2px 4px",
                              borderRadius: 6,
                              transition: "color 0.2s",
                            }}
                          >
                            {copiedId === i ? (
                              <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                Disalin!
                              </>
                            ) : (
                              <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                Salin
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: 12, borderTop: "1px solid #E2E8F0", background: "white", display: "flex", gap: 8 }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tanya asisten AI..."
                style={{
                  flex: 1,
                  border: "1px solid #E2E8F0",
                  borderRadius: 20,
                  padding: "10px 16px",
                  fontSize: 13.5,
                  outline: "none",
                  resize: "none",
                  height: 42,
                  fontFamily: "inherit",
                  background: "#F1F5F9",
                  color: "#1E293B",
                  overflow: "hidden"
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  border: "none",
                  background: !input.trim() ? "#CBD5E1" : "#0EA5E9",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: !input.trim() ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                  flexShrink: 0
                }}
              >
                <Send size={18} style={{ marginLeft: -2 }} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Floating Button */}
      <button
        onClick={() => { setIsOpen(true); setIsMinimized(false); }}
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 60,
          height: 60,
          borderRadius: 30,
          background: "linear-gradient(135deg, #0EA5E9, #0284C7)",
          border: "none",
          boxShadow: "0 8px 24px rgba(2,132,199,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: 4,
          transition: "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.4s",
          transform: isOpen ? "scale(0) rotate(-90deg)" : "scale(1) rotate(0deg)",
          opacity: isOpen ? 0 : 1,
          pointerEvents: isOpen ? "none" : "auto",
        }}
      >
        <img src="/ailogo.png" alt="AI" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
      </button>
    </div>
  );
}
