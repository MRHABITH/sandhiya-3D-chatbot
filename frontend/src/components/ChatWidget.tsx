import { useState, useRef, useEffect, Suspense } from "react";
import { sendMessage, type ChatResponse, saveApiKeys, uploadDocument } from "../lib/api";
import { Send, Eye, Settings, Paperclip } from "lucide-react";
import ThreeDViewer from "./ThreeDViewer";
import SettingsModal from "./SettingsModal";
import "./ChatWidget.css";

interface Message {
  sender: "user" | "bot";
  text: string;
  sources?: Array<{ url: string; title: string }>;
  scene?: string;
  asset_id?: string;
  dynamic_objects?: unknown[];
  visualization_type?: string;
}

interface ChatWidgetProps {
  onExpandScene?: (
    scene: string,
    assetId?: string,
    dynamicObjects?: unknown[]
  ) => void;
}

export default function ChatWidget({ onExpandScene }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [enable3D, setEnable3D] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      const response: ChatResponse = await sendMessage(userMessage, sessionId, enable3D);

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: response.reply || response.text_response || "No response generated.",
          sources: response.sources,
          scene: response.scene,
          asset_id: response.asset_id,
          dynamic_objects: response.dynamic_objects,
          visualization_type: response.visualization_type
        }
      ]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Sorry, I'm having trouble connecting to the server.";
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: errorMessage
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSaveApiKeys = async (groqKey: string, tripoKey: string) => {
    try {
      const response = await saveApiKeys(groqKey, tripoKey, 'user-1');
      if (!response.success) {
        throw new Error(response.message || 'Failed to save API keys');
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to save API keys');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      return;
    }

    setIsUploading(true);

    try {
      const response = await uploadDocument(file, sessionId);
      if (response.success) {
        setMessages((prev) => [...prev, { 
          sender: "bot", 
          text: `📎 Document "${file.name}" uploaded successfully. I can now answer questions about its content.` 
        }]);
      }
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="chat-widget">
      {/* Header */}
      <div className="chat-header">
        <div className="header-info">
          <div className="bot-avatar">🤖</div>
          <div className="header-text">
            <h3>GoGenix AI</h3>
            <p>3D Generator</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              transition: 'all 0.3s',
              fontSize: '0'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(100, 116, 139, 0.1)';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = '#64748b';
            }}
            title="Settings"
          >
            <Settings size={20} />
          </button>

          {/* Online Badge */}
          <div className="status-badge">
            <span className="status-dot"></span>
            <span>Online</span>
          </div>
        </div>
      </div>

      {/* Sub-header with 3D Toggle */}
      <div className="chat-subheader">
        <label className="toggle-container">
          <input 
            type="checkbox" 
            checked={enable3D} 
            onChange={(e) => setEnable3D(e.target.checked)} 
          />
          <span className="toggle-slider"></span>
          <span className="toggle-label">{enable3D ? "3D Generation Enabled" : "3D Generation Disabled"}</span>
        </label>
      </div>

      {/* Messages Container */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="welcome-message">
            <div className="welcome-icon">🏢</div>
            <h3>GoGenix Enterprise AI</h3>
            <p>Welcome to your corporate intelligence assistant. Upload documents or ask questions to begin.</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`message-group ${msg.sender}`}>
            <div className={`message ${msg.sender}`}>
              <div className="message-content">{msg.text}</div>
              
              {msg.scene && msg.scene !== 'none' && (
                <div style={{ marginTop: "16px" }}>
                  {/* Mini 3D Viewer Preview */}
                  <div style={{
                    width: "100%",
                    height: "250px",
                    borderRadius: "12px",
                    overflow: "hidden",
                    marginBottom: "12px",
                    border: "1px solid rgba(0, 0, 0, 0.1)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
                  }}>
                    <Suspense fallback={
                      <div style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#f5f5f5",
                        color: "#666",
                        fontSize: "14px"
                      }}>
                        Loading 3D Model...
                      </div>
                    }>
                      <ThreeDViewer 
                        activeScene={msg.scene} 
                        isMini={true}
                        assetId={msg.asset_id} 
                        dynamicObjects={msg.dynamic_objects}
                      />
                    </Suspense>
                  </div>

                  {/* View Full Screen Button */}
                  <button
                    onClick={() =>
                      onExpandScene?.(msg.scene!, msg.asset_id, msg.dynamic_objects)
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 14px",
                      background: msg.sender === "user" ? "rgba(255, 255, 255, 0.2)" : "#2563eb",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      transition: "all 0.3s",
                      width: "100%",
                      justifyContent: "center"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.8";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <Eye size={16} />
                    View Full Screen
                  </button>
                </div>
              )}

              {msg.sources && msg.sources.length > 0 && (
                <div className="message-sources">
                  <strong>Sources:</strong>
                  <ul>
                    {msg.sources.map((src, i) => (
                      <li key={i}>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {src.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message-group bot">
            <div className="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".pdf"
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="upload-btn"
          disabled={isLoading || isUploading}
          title="Upload Company PDF"
        >
          {isUploading ? (
            <div className="upload-spinner"></div>
          ) : (
            <Paperclip className="upload-icon" />
          )}
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={isUploading ? "Uploading document..." : "Type your message..."}
          className="chat-input"
          disabled={isLoading || isUploading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || isUploading || !input.trim()}
          className="send-button"
          aria-label="Send message"
        >
          <Send className="send-icon" />
        </button>
      </div>

      {/* Footer */}
      <div className="chat-footer">
        @2026 created by Sandhiya and his team. All rights reserved.
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveApiKeys}
      />
    </div>
  );
}