import React, { useRef, useEffect } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  disabled,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 자동 높이 조절
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        background: "linear-gradient(0deg, var(--c-bg-start) 85%, transparent)",
        padding: "10px 16px 18px",
      }}
    >
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          display: "flex",
          gap: 10,
          alignItems: "flex-end",
        }}
      >
        {/* 텍스트 입력 */}
        <div
          style={{
            flex: 1,
            background: "var(--c-surface-alt)",
            borderRadius: 15,
            border: "1.5px solid #DDD4C8",
            overflow: "hidden",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="변호사 광고에 대해 질문하세요..."
            rows={1}
            disabled={disabled}
            style={{
              width: "100%",
              border: "none",
              padding: "13px 17px",
              fontSize: 14.5,
              fontFamily: "inherit",
              resize: "none",
              background: "transparent",
              color: "var(--c-text)",
              lineHeight: 1.5,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* 전송 버튼 */}
        <button
          onClick={onSend}
          disabled={!canSend}
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            border: "none",
            background: canSend
              ? "linear-gradient(135deg, #5C4033, #6B4F3A)"
              : "#D4C8B8",
            color: "#FFF",
            cursor: canSend ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            flexShrink: 0,
            fontFamily: "inherit",
            transition: "all 0.2s",
            boxShadow: canSend
              ? "0 4px 12px rgba(92,64,51,0.3)"
              : "none",
          }}
        >
          {disabled ? "⏳" : "↑"}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
