import React from "react";

interface HeaderProps {
  hasMessages: boolean;
  onClear: () => void;
}

const Header: React.FC<HeaderProps> = ({ hasMessages, onClear }) => {
  return (
    <header
      style={{
        background: "linear-gradient(135deg, #3A2E22, #5C4033)",
        padding: "18px 20px",
        color: "var(--c-cream)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 4px 20px rgba(58,46,34,0.3)",
      }}
    >
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 11,
              background: "rgba(255,248,240,0.14)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            ⚖️
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: "-0.4px",
              }}
            >
              변호사 광고 규정 검사기
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 11.5,
                opacity: 0.65,
                marginTop: 2,
                fontWeight: 500,
              }}
            >
              대한변호사협회 광고규정 (2025.2.6. 개정) · 삼단논법 분석
            </p>
          </div>
        </div>

        {hasMessages && (
          <button
            onClick={onClear}
            style={{
              background: "rgba(255,248,240,0.14)",
              border: "none",
              color: "var(--c-cream)",
              padding: "7px 14px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "inherit",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,248,240,0.25)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,248,240,0.14)")
            }
          >
            새 대화
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
