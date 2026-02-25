import React, { useState, useRef, useEffect } from "react";
import type { ScanResult } from "../types";

interface Props {
  results: ScanResult[];
  onClear: () => void;
}

type FilterKey = "all" | "violation" | "warning" | "clean";
type SortKey = "newest" | "oldest" | "violation_first" | "clean_first";

// ─── 아이콘 컴포넌트 ──────────────────────────────────────────────────────────
const IconShield = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconAlertTriangle = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconCheckCircle = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconBarChart = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IconChevronDown = ({ size = 16, color = "currentColor", rotated = false }: { size?: number; color?: string; rotated?: boolean }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)", transform: rotated ? "rotate(180deg)" : "none" }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconTrash = ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
);

const IconLink = ({ size = 12, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
  </svg>
);

const IconClock = ({ size = 11, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconSearch = ({ size = 48, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconSortDesc = ({ size = 13, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="4" />
    <polyline points="6 14 12 20 18 14" />
  </svg>
);

// ─── 접힘 애니메이션 래퍼 ──────────────────────────────────────────────────────
const Collapsible: React.FC<{ open: boolean; children: React.ReactNode }> = ({ open, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => {
        if (ref.current) setHeight(ref.current.scrollHeight);
      });
    } else {
      if (ref.current) setHeight(0);
      const t = setTimeout(() => setVisible(false), 350);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!visible && !open) return null;

  return (
    <div
      style={{
        overflow: "hidden",
        height: open ? height || "auto" : 0,
        transition: "height 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        willChange: "height",
      }}
    >
      <div ref={ref}>{children}</div>
    </div>
  );
};

// ─── 상태별 설정 ──────────────────────────────────────────────────────────────
const STATUS = {
  violation: {
    label: "위반",
    color: "#EF4444",
    colorMuted: "rgba(239,68,68,0.15)",
    colorBorder: "rgba(239,68,68,0.3)",
    glow: "0 0 0 2px rgba(239,68,68,0.25), 0 0 20px rgba(239,68,68,0.1)",
    Icon: IconAlertTriangle,
    badge: "badge-violation",
    barColor: "#EF4444",
  },
  warning: {
    label: "주의",
    color: "#F59E0B",
    colorMuted: "rgba(245,158,11,0.15)",
    colorBorder: "rgba(245,158,11,0.3)",
    glow: "0 0 0 2px rgba(245,158,11,0.25), 0 0 20px rgba(245,158,11,0.1)",
    Icon: IconAlertTriangle,
    badge: "badge-warning",
    barColor: "#F59E0B",
  },
  clean: {
    label: "적법",
    color: "#22C55E",
    colorMuted: "rgba(34,197,94,0.15)",
    colorBorder: "rgba(34,197,94,0.3)",
    glow: "0 0 0 2px rgba(34,197,94,0.25), 0 0 20px rgba(34,197,94,0.1)",
    Icon: IconCheckCircle,
    badge: "badge-clean",
    barColor: "#22C55E",
  },
} as const;

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
const ResultsPanel: React.FC<Props> = ({ results, onClear }) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [confirmClear, setConfirmClear] = useState(false);

  const counts = {
    all: results.length,
    violation: results.filter((r) => r.status === "violation").length,
    warning: results.filter((r) => r.status === "warning").length,
    clean: results.filter((r) => r.status === "clean").length,
  };

  const sorted = [...(filter === "all" ? results : results.filter((r) => r.status === filter))].sort((a, b) => {
    if (sort === "newest") return new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime();
    if (sort === "oldest") return new Date(a.scannedAt).getTime() - new Date(b.scannedAt).getTime();
    if (sort === "violation_first") {
      const order = { violation: 0, warning: 1, clean: 2 };
      return order[a.status] - order[b.status];
    }
    if (sort === "clean_first") {
      const order = { clean: 0, warning: 1, violation: 2 };
      return order[a.status] - order[b.status];
    }
    return 0;
  });

  // ─── 빈 상태 ──────────────────────────────────────────────────────────────
  if (results.length === 0) {
    return (
      <div
        className="slide-up"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "72px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            background: "rgba(124,58,237,0.08)",
            border: "1px solid rgba(124,58,237,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
          }}
        >
          <IconSearch size={44} color="rgba(124,58,237,0.5)" />
        </div>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#E2E8F0",
            marginBottom: 10,
            letterSpacing: "-0.3px",
          }}
        >
          스캔 결과가 없습니다
        </h3>
        <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.6, maxWidth: 320, marginBottom: 28 }}>
          스캐너 탭에서 URL 또는 키워드를 입력하면
          <br />
          AI가 광고 규정 위반 여부를 분석합니다
        </p>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: 10,
            background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(59,130,246,0.15))",
            border: "1px solid rgba(124,58,237,0.25)",
            fontSize: 13,
            color: "#A78BFA",
            fontWeight: 600,
          }}
        >
          <IconBarChart size={15} color="#A78BFA" />
          스캐너 탭으로 이동하여 시작하세요
        </div>
      </div>
    );
  }

  // ─── 상단 통계 대시보드 ────────────────────────────────────────────────────
  const statCards: {
    key: FilterKey;
    label: string;
    Icon: React.FC<{ size?: number; color?: string }>;
    color: string;
    colorMuted: string;
    colorBorder: string;
    glow: string;
  }[] = [
    {
      key: "all",
      label: "전체 스캔",
      Icon: IconBarChart,
      color: "#A78BFA",
      colorMuted: "rgba(167,139,250,0.12)",
      colorBorder: "rgba(167,139,250,0.3)",
      glow: "0 0 0 2px rgba(167,139,250,0.3), 0 0 20px rgba(167,139,250,0.1)",
    },
    {
      key: "violation",
      label: "위반 의심",
      Icon: IconAlertTriangle,
      color: "#EF4444",
      colorMuted: "rgba(239,68,68,0.12)",
      colorBorder: "rgba(239,68,68,0.3)",
      glow: "0 0 0 2px rgba(239,68,68,0.3), 0 0 20px rgba(239,68,68,0.1)",
    },
    {
      key: "warning",
      label: "주의 필요",
      Icon: IconAlertTriangle,
      color: "#F59E0B",
      colorMuted: "rgba(245,158,11,0.12)",
      colorBorder: "rgba(245,158,11,0.3)",
      glow: "0 0 0 2px rgba(245,158,11,0.3), 0 0 20px rgba(245,158,11,0.1)",
    },
    {
      key: "clean",
      label: "적법 판정",
      Icon: IconCheckCircle,
      color: "#22C55E",
      colorMuted: "rgba(34,197,94,0.12)",
      colorBorder: "rgba(34,197,94,0.3)",
      glow: "0 0 0 2px rgba(34,197,94,0.3), 0 0 20px rgba(34,197,94,0.1)",
    },
  ];

  return (
    <div className="slide-up">
      {/* ── 통계 벤토 그리드 ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          marginBottom: 20,
        }}
      >
        {statCards.map(({ key, label, Icon, color, colorMuted, colorBorder, glow }) => {
          const active = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                background: active ? colorMuted : "rgba(255,255,255,0.03)",
                border: `1px solid ${active ? colorBorder : "rgba(255,255,255,0.07)"}`,
                boxShadow: active ? glow : "none",
                borderRadius: 14,
                padding: "16px 12px",
                cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                textAlign: "center",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: active ? colorMuted : "rgba(255,255,255,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.25s",
                }}
              >
                <Icon size={17} color={active ? color : "#64748B"} />
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: active ? color : "#E2E8F0",
                  lineHeight: 1,
                  letterSpacing: "-1px",
                  transition: "color 0.25s",
                }}
              >
                {counts[key]}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: active ? color : "#64748B",
                  fontWeight: 600,
                  letterSpacing: "0.3px",
                  transition: "color 0.25s",
                }}
              >
                {label}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── 필터 바 ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>
            <span style={{ color: "#A78BFA", fontWeight: 700 }}>{sorted.length}</span>건 표시
          </span>

          {/* 정렬 선택 */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 6 }}>
            <IconSortDesc size={13} color="#64748B" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                color: "#94A3B8",
                fontSize: 12,
                fontFamily: "inherit",
                padding: "5px 10px",
                cursor: "pointer",
                outline: "none",
                appearance: "none",
                WebkitAppearance: "none",
                paddingRight: 22,
              }}
            >
              <option value="newest" style={{ background: "#1a1a2e" }}>최신순</option>
              <option value="oldest" style={{ background: "#1a1a2e" }}>오래된순</option>
              <option value="violation_first" style={{ background: "#1a1a2e" }}>위반 우선</option>
              <option value="clean_first" style={{ background: "#1a1a2e" }}>적법 우선</option>
            </select>
            <div style={{ position: "absolute", right: 6, pointerEvents: "none" }}>
              <IconChevronDown size={11} color="#64748B" />
            </div>
          </div>
        </div>

        {/* 전체 삭제 버튼 */}
        {!confirmClear ? (
          <button
            onClick={() => setConfirmClear(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid rgba(239,68,68,0.2)",
              background: "rgba(239,68,68,0.06)",
              color: "#F87171",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s",
            }}
          >
            <IconTrash size={13} color="#F87171" />
            전체 삭제
          </button>
        ) : (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#F87171", fontWeight: 600 }}>정말 삭제할까요?</span>
            <button
              onClick={() => { onClear(); setConfirmClear(false); }}
              style={{
                padding: "5px 12px",
                borderRadius: 7,
                border: "1px solid rgba(239,68,68,0.4)",
                background: "rgba(239,68,68,0.15)",
                color: "#F87171",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              삭제
            </button>
            <button
              onClick={() => setConfirmClear(false)}
              style={{
                padding: "5px 12px",
                borderRadius: 7,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
                color: "#94A3B8",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              취소
            </button>
          </div>
        )}
      </div>

      {/* ── 결과 카드 리스트 ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map((r) => {
          const cfg = STATUS[r.status];
          const isOpen = expanded === r.id;

          return (
            <div
              key={r.id}
              style={{
                borderRadius: 14,
                border: `1px solid ${isOpen ? cfg.colorBorder : "rgba(255,255,255,0.07)"}`,
                background: "rgba(255,255,255,0.03)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                overflow: "hidden",
                boxShadow: isOpen ? cfg.glow : "none",
                transition: "border-color 0.3s, box-shadow 0.3s",
              }}
            >
              {/* 왼쪽 상태 컬러 바 */}
              <div style={{ display: "flex" }}>
                <div
                  style={{
                    width: 4,
                    flexShrink: 0,
                    background: `linear-gradient(to bottom, ${cfg.color}, ${cfg.color}88)`,
                    borderRadius: "14px 0 0 14px",
                    transition: "background 0.3s",
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* 요약 행 */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : r.id)}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      textAlign: "left",
                      fontFamily: "inherit",
                    }}
                  >
                    {/* 상태 아이콘 */}
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: cfg.colorMuted,
                        border: `1px solid ${cfg.colorBorder}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <cfg.Icon size={18} color={cfg.color} />
                    </div>

                    {/* 텍스트 영역 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* 제목 줄 */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 4,
                          flexWrap: "wrap",
                        }}
                      >
                        {/* 상태 배지 */}
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "2px 9px",
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 700,
                            background: cfg.colorMuted,
                            color: cfg.color,
                            border: `1px solid ${cfg.colorBorder}`,
                            letterSpacing: "0.3px",
                            flexShrink: 0,
                          }}
                        >
                          {cfg.label}
                        </span>

                        {/* 위반 건수 칩 */}
                        {r.violations.length > 0 && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                              padding: "2px 8px",
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 600,
                              background: "rgba(255,255,255,0.05)",
                              color: "#94A3B8",
                              border: "1px solid rgba(255,255,255,0.07)",
                              flexShrink: 0,
                            }}
                          >
                            {r.violations.length}건 탐지
                          </span>
                        )}

                        {/* 제목 */}
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#E2E8F0",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {r.title}
                        </span>
                      </div>

                      {/* URL + 시간 */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            color: "#7C3AED",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 260,
                          }}
                        >
                          <IconLink size={10} color="#7C3AED" />
                          {r.url}
                        </span>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                            fontSize: 11,
                            color: "#475569",
                            flexShrink: 0,
                          }}
                        >
                          <IconClock size={10} color="#475569" />
                          {new Date(r.scannedAt).toLocaleString("ko-KR", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* 위반 항목 태그 칩 */}
                      {r.violations.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            gap: 5,
                            marginTop: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          {r.violations.slice(0, 4).map((v, i) => (
                            <span
                              key={i}
                              style={{
                                padding: "2px 8px",
                                borderRadius: 6,
                                fontSize: 10.5,
                                fontWeight: 600,
                                background:
                                  v.type === "violation"
                                    ? "rgba(239,68,68,0.1)"
                                    : "rgba(245,158,11,0.1)",
                                color: v.type === "violation" ? "#F87171" : "#FCD34D",
                                border: `1px solid ${
                                  v.type === "violation"
                                    ? "rgba(239,68,68,0.2)"
                                    : "rgba(245,158,11,0.2)"
                                }`,
                              }}
                            >
                              {v.article}
                              {" · "}
                              <span style={{ fontWeight: 400, opacity: 0.85 }}>
                                "{v.keyword.length > 8 ? v.keyword.slice(0, 8) + "…" : v.keyword}"
                              </span>
                            </span>
                          ))}
                          {r.violations.length > 4 && (
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: 6,
                                fontSize: 10.5,
                                color: "#64748B",
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.07)",
                              }}
                            >
                              +{r.violations.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 펼침 화살표 */}
                    <div style={{ flexShrink: 0, marginLeft: 4 }}>
                      <IconChevronDown size={15} color="#475569" rotated={isOpen} />
                    </div>
                  </button>

                  {/* ── 상세 펼침 영역 ── */}
                  <Collapsible open={isOpen}>
                    <div
                      style={{
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        padding: "16px 16px 18px",
                      }}
                    >
                      {/* 헤더 */}
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#475569",
                          letterSpacing: "0.8px",
                          textTransform: "uppercase",
                          marginBottom: 10,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <IconShield size={12} color="#475569" />
                        AI 삼단논법 분석
                      </div>

                      {/* 분석 텍스트 - 코드블록 스타일 */}
                      <div
                        style={{
                          background: "rgba(0,0,0,0.35)",
                          borderRadius: 10,
                          border: "1px solid rgba(255,255,255,0.06)",
                          overflow: "hidden",
                        }}
                      >
                        {/* 코드 에디터 상단 바 */}
                        <div
                          style={{
                            padding: "8px 14px",
                            background: "rgba(255,255,255,0.03)",
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", opacity: 0.7 }} />
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B", opacity: 0.7 }} />
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", opacity: 0.7 }} />
                          <span style={{ fontSize: 11, color: "#475569", marginLeft: 6, fontFamily: "monospace" }}>
                            analysis.txt
                          </span>
                        </div>

                        {/* 라인 번호 + 텍스트 */}
                        <div
                          style={{
                            display: "flex",
                            maxHeight: 320,
                            overflowY: "auto",
                          }}
                        >
                          {/* 라인 번호 */}
                          <div
                            style={{
                              padding: "12px 0",
                              minWidth: 36,
                              background: "rgba(0,0,0,0.2)",
                              borderRight: "1px solid rgba(255,255,255,0.04)",
                              userSelect: "none",
                              flexShrink: 0,
                            }}
                          >
                            {r.analysisText.split("\n").map((_, i) => (
                              <div
                                key={i}
                                style={{
                                  padding: "0 10px",
                                  fontSize: 11,
                                  lineHeight: "1.7",
                                  color: "#334155",
                                  textAlign: "right",
                                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                                }}
                              >
                                {i + 1}
                              </div>
                            ))}
                          </div>

                          {/* 본문 */}
                          <pre
                            style={{
                              flex: 1,
                              margin: 0,
                              padding: "12px 16px",
                              fontSize: 12,
                              lineHeight: 1.7,
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              color: "#CBD5E1",
                              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                              background: "transparent",
                            }}
                          >
                            {r.analysisText}
                          </pre>
                        </div>
                      </div>

                      {/* 위반 항목 상세 테이블 */}
                      {r.violations.length > 0 && (
                        <div style={{ marginTop: 14 }}>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#475569",
                              letterSpacing: "0.8px",
                              textTransform: "uppercase",
                              marginBottom: 8,
                            }}
                          >
                            탐지된 위반 항목 ({r.violations.length}건)
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {r.violations.map((v, i) => (
                              <div
                                key={i}
                                style={{
                                  display: "flex",
                                  gap: 10,
                                  padding: "10px 12px",
                                  borderRadius: 8,
                                  background:
                                    v.type === "violation"
                                      ? "rgba(239,68,68,0.06)"
                                      : "rgba(245,158,11,0.06)",
                                  border: `1px solid ${
                                    v.type === "violation"
                                      ? "rgba(239,68,68,0.15)"
                                      : "rgba(245,158,11,0.15)"
                                  }`,
                                }}
                              >
                                <div
                                  style={{
                                    flexShrink: 0,
                                    marginTop: 1,
                                  }}
                                >
                                  {v.type === "violation" ? (
                                    <IconAlertTriangle size={14} color="#EF4444" />
                                  ) : (
                                    <IconAlertTriangle size={14} color="#F59E0B" />
                                  )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                      marginBottom: 3,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: v.type === "violation" ? "#F87171" : "#FCD34D",
                                        fontFamily: "monospace",
                                      }}
                                    >
                                      {v.article}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: 11,
                                        padding: "1px 7px",
                                        borderRadius: 4,
                                        background: "rgba(0,0,0,0.2)",
                                        color: "#94A3B8",
                                        fontFamily: "monospace",
                                      }}
                                    >
                                      "{v.keyword}"
                                    </span>
                                  </div>
                                  <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>
                                    {v.description}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Collapsible>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 필터 결과 없음 */}
      {sorted.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "#475569",
            fontSize: 14,
          }}
        >
          해당 조건의 결과가 없습니다
        </div>
      )}
    </div>
  );
};

export default ResultsPanel;
