import React, { useState, useRef, useEffect, useCallback } from "react";
import { Header, ChatBubble, WelcomeScreen, ChatInput } from "./components";
import { sendChat } from "./services/api";
import type { ChatMessage } from "./types";

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

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
    } catch (err: any) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ 오류가 발생했습니다.\n${err.message}\n\n다시 시도해주세요.`,
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
