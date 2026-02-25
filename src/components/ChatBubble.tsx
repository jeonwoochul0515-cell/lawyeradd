import React from "react";
import Markdown from "react-markdown";

/* ── Loading Dots ── */
const LoadingDots: React.FC = () => (
  <div
    style={{
      display: "flex",
      gap: 7,
      padding: "10px 0",
      alignItems: "center",
    }}
  >
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: "var(--c-accent)",
          animation: `dotBounce 1.2s ease-in-out ${i * 0.15}s infinite`,
        }}
      />
    ))}
  </div>
);

/* ── Chat Bubble ── */
interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  role,
  content,
  isLoading = false,
}) => {
  const isUser = role === "user";

  return (
    <div
      className="animate-slide-in"
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 18,
      }}
    >
      {/* 어시스턴트 아바타 */}
      {!isUser && (
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #5C4033, #8B7355)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginRight: 10,
            marginTop: 4,
            fontSize: 17,
          }}
        >
          ⚖️
        </div>
      )}

      {/* 메시지 버블 */}
      <div
        className={!isUser && !isLoading ? "markdown-body" : undefined}
        style={{
          maxWidth: "82%",
          padding: "15px 19px",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          background: isUser
            ? "linear-gradient(135deg, #5C4033, #6B4F3A)"
            : "var(--c-surface)",
          color: isUser ? "var(--c-cream)" : "var(--c-text)",
          fontSize: 14.5,
          lineHeight: 1.75,
          wordBreak: "break-word",
          boxShadow: isUser
            ? "0 2px 10px rgba(92,64,51,0.25)"
            : "0 1px 6px rgba(0,0,0,0.07)",
          border: isUser ? "none" : "1px solid var(--c-border)",
        }}
      >
        {isLoading ? (
          <LoadingDots />
        ) : isUser ? (
          <span style={{ whiteSpace: "pre-wrap" }}>{content}</span>
        ) : (
          <Markdown>{content}</Markdown>
        )}
      </div>

      {/* 유저 아바타 */}
      {isUser && (
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #D4A574, #C4956A)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginLeft: 10,
            marginTop: 4,
            fontSize: 16,
            color: "#FFF",
            fontWeight: 700,
          }}
        >
          Q
        </div>
      )}
    </div>
  );
};

export default ChatBubble;
