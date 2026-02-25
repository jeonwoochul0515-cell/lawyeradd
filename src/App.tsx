import React, { useState, useRef, useEffect, useCallback } from "react";
import { Header, ChatBubble, WelcomeScreen, ChatInput } from "./components";
import { sendChat } from "./services/api";
import type { ChatMessage } from "./types";

const STORAGE_KEY = "lawyer-ad-checker-messages";

function loadMessages(): ChatMessage[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is ChatMessage =>
        typeof m === "object" &&
        m !== null &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
    );
  } catch {
    return [];
  }
}

function saveMessages(messages: ChatMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // 저장 공간 부족 시 무시
  }
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  /* ── LocalStorage 동기화 ── */
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  /* ── 자동 스크롤 ── */
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 60);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  /* ── 메시지 전송 ── */
  const handleSend = async (text?: string) => {
    const query = (text ?? input).trim();
    if (!query || isLoading) return;

    setInput("");

    const userMsg: ChatMessage = { role: "user", content: query };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const answer = await sendChat(updatedMessages);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: answer },
      ]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "알 수 없는 오류";
      console.error("Chat error:", message);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ 오류가 발생했습니다.\n${message}\n\n다시 시도해주세요.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /* ── 대화 초기화 ── */
  const handleClear = () => {
    setMessages([]);
    setInput("");
  };

  const showWelcome = messages.length === 0 && !isLoading;

  return (
    <>
      <Header hasMessages={messages.length > 0} onClear={handleClear} />

      {/* 채팅 영역 */}
      <div
        style={{
          flex: 1,
          maxWidth: 700,
          width: "100%",
          margin: "0 auto",
          padding: "20px 16px 10px",
          overflowY: "auto",
        }}
      >
        {showWelcome && (
          <WelcomeScreen onSelectQuestion={(q) => handleSend(q)} />
        )}

        {messages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} content={msg.content} />
        ))}

        {isLoading && (
          <ChatBubble role="assistant" content="" isLoading />
        )}

        <div ref={endRef} />
      </div>

      {/* 입력 영역 */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={() => handleSend()}
        disabled={isLoading}
      />
    </>
  );
};

export default App;
