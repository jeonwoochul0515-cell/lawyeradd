import React from "react";
import { EXAMPLE_QUESTIONS } from "../data/regulations";

interface WelcomeScreenProps {
  onSelectQuestion: (question: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectQuestion }) => {
  return (
    <div className="animate-fade-in">
      {/* 타이틀 영역 */}
      <div style={{ textAlign: "center", padding: "36px 20px 28px" }}>
        <div
          className="animate-scale-in"
          style={{
            width: 68,
            height: 68,
            borderRadius: 18,
            background: "linear-gradient(135deg, #5C4033, #8B7355)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 34,
            margin: "0 auto 18px",
            boxShadow: "0 8px 24px rgba(92,64,51,0.3)",
          }}
        >
          ⚖️
        </div>
        <h2
          style={{
            color: "var(--c-text)",
            fontSize: 21,
            fontWeight: 800,
            margin: "0 0 8px",
            letterSpacing: "-0.4px",
          }}
        >
          변호사 광고, 이거 해도 되나요?
        </h2>
        <p
          style={{
            color: "var(--c-text-muted)",
            fontSize: 13.5,
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          광고 내용이나 방법을 알려주시면
          <br />
          삼단논법으로 규정 위반 여부를 분석합니다
        </p>
      </div>

      {/* 배지 */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "var(--c-surface-alt)",
            padding: "7px 15px",
            borderRadius: 18,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            fontSize: 12,
            color: "var(--c-primary)",
            fontWeight: 600,
          }}
        >
          📜 2025 법규집 · 전21조 · 삼단논법 AI 분석
        </div>
      </div>

      {/* 예시 질문 */}
      <div style={{ padding: "0 4px" }}>
        <p
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: "var(--c-accent)",
            letterSpacing: 0.8,
            marginBottom: 12,
          }}
        >
          💬 이런 질문을 해보세요
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          {EXAMPLE_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => onSelectQuestion(q)}
              style={{
                background: "var(--c-surface-alt)",
                border: "1.5px solid var(--c-border)",
                borderRadius: "var(--radius-md)",
                padding: "13px 15px",
                cursor: "pointer",
                textAlign: "left",
                fontSize: 13.5,
                color: "#4A3C2E",
                lineHeight: 1.5,
                fontWeight: 500,
                transition: "all 0.2s ease",
                animation: `slideUp 0.4s ease-out ${i * 0.06}s both`,
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--c-accent)";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(92,64,51,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--c-border)";
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* 면책조항 */}
      <div
        style={{
          marginTop: 28,
          padding: "13px 16px",
          background: "rgba(139,115,85,0.07)",
          borderRadius: 11,
          borderLeft: "3px solid var(--c-accent)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "var(--c-text-muted)",
            lineHeight: 1.6,
          }}
        >
          ⚠️ 이 도구는 「변호사 광고에 관한 규정」을 기반으로 AI가 참고용
          분석을 제공합니다. 최종 판단은 반드시 변호사에게 확인하시기 바랍니다.
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
