import React, { useState } from "react";
import type { ScanResult } from "../types";
import { STATUS_CONFIG } from "../data/constants";

interface Props {
  results: ScanResult[];
  onClear: () => void;
}

const ResultsPanel: React.FC<Props> = ({ results, onClear }) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "violation" | "warning" | "clean">("all");

  const filtered = filter === "all" ? results : results.filter((r) => r.status === filter);

  const counts = {
    all: results.length,
    violation: results.filter((r) => r.status === "violation").length,
    warning: results.filter((r) => r.status === "warning").length,
    clean: results.filter((r) => r.status === "clean").length,
  };

  if (results.length === 0) {
    return (
      <div className="slide-up" style={{
        textAlign: "center", padding: "60px 20px", color: "var(--c-muted)",
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <p style={{ fontSize: 15, fontWeight: 600 }}>아직 스캔 결과가 없습니다</p>
        <p style={{ fontSize: 13, marginTop: 6 }}>스캐너 탭에서 URL 또는 키워드로 스캔을 시작하세요</p>
      </div>
    );
  }

  const s = {
    badge: (status: keyof typeof STATUS_CONFIG) => ({
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600,
      background: STATUS_CONFIG[status].bg, color: STATUS_CONFIG[status].color,
    } as React.CSSProperties),
    filterBtn: (active: boolean) => ({
      padding: "6px 14px", borderRadius: 8, border: "1px solid var(--c-border)",
      fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
      background: active ? "var(--c-primary-l)" : "transparent",
      color: active ? "#FFF" : "var(--c-muted)", transition: "all .2s",
    } as React.CSSProperties),
  };

  return (
    <div className="slide-up">
      {/* 요약 통계 */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16,
      }}>
        {([
          { key: "all", label: "전체", emoji: "📊", color: "var(--c-accent)" },
          { key: "violation", label: "위반", emoji: "❌", color: "var(--c-red)" },
          { key: "warning", label: "주의", emoji: "⚠️", color: "var(--c-yellow)" },
          { key: "clean", label: "적법", emoji: "✅", color: "var(--c-green)" },
        ] as const).map((item) => (
          <div key={item.key} style={{
            background: "var(--c-surface)", borderRadius: 12, padding: "14px 12px",
            textAlign: "center", border: "1px solid var(--c-border)",
            cursor: "pointer", transition: "all .2s",
            outline: filter === item.key ? `2px solid ${item.color}` : "none",
          }}
          onClick={() => setFilter(item.key)}
          >
            <div style={{ fontSize: 22 }}>{item.emoji}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: item.color, marginTop: 4 }}>
              {counts[item.key]}
            </div>
            <div style={{ fontSize: 11, color: "var(--c-muted)" }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* 결과 목록 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "var(--c-muted)" }}>
          {filtered.length}건 표시 중
        </span>
        <button onClick={onClear} style={{
          padding: "5px 12px", borderRadius: 6, border: "1px solid #FECACA",
          background: "#FEF2F2", color: "#B91C1C", fontSize: 12, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
        }}>
          🗑️ 전체 삭제
        </button>
      </div>

      {filtered.map((r) => (
        <div key={r.id} style={{
          background: "var(--c-surface)", borderRadius: 12,
          border: "1px solid var(--c-border)", marginBottom: 10,
          overflow: "hidden", transition: "all .2s",
        }}>
          {/* 요약 행 */}
          <div
            onClick={() => setExpanded(expanded === r.id ? null : r.id)}
            style={{
              padding: "14px 16px", cursor: "pointer",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={s.badge(r.status)}>
                  {STATUS_CONFIG[r.status].emoji} {STATUS_CONFIG[r.status].label}
                </span>
                {r.violations.length > 0 && (
                  <span style={{ fontSize: 11, color: "var(--c-muted)" }}>
                    {r.violations.length}건 탐지
                  </span>
                )}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.title}
              </div>
              <div style={{ fontSize: 11, color: "var(--c-accent)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.url}
              </div>
            </div>
            <div style={{ fontSize: 18, color: "var(--c-muted)", marginLeft: 8, transition: "transform .2s", transform: expanded === r.id ? "rotate(180deg)" : "none" }}>
              ▾
            </div>
          </div>

          {/* 상세 펼침 */}
          {expanded === r.id && (
            <div style={{ padding: "0 16px 16px", borderTop: "1px solid #F0EBE3" }}>
              <pre style={{
                marginTop: 12, padding: 14, background: "#FAF8F4", borderRadius: 10,
                fontSize: 12.5, lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word",
                color: "var(--c-text)", fontFamily: "var(--font)",
              }}>
                {r.analysisText}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ResultsPanel;
