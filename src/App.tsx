import React, { useState, useCallback } from "react";
import { ScannerPanel, ResultsPanel, ReportPanel } from "./components";
import { TABS } from "./data/constants";
import type { ScanResult, TabId } from "./types";

// ── 탭 아이콘 SVG ──────────────────────────────────────────────
const IconScanner = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ color: active ? "transparent" : "currentColor",
      background: active ? "linear-gradient(135deg,#7C3AED,#3B82F6,#06B6D4)" : undefined,
      WebkitBackgroundClip: active ? "text" : undefined,
      WebkitTextFillColor: active ? "transparent" : undefined,
    }}>
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconResults = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3"/>
    <path d="M3 9h18M9 21V9"/>
  </svg>
);

const IconReport = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const NAV_ICONS: Record<TabId, React.ReactNode> = {
  scanner: <IconScanner active={false} />,
  results: <IconResults />,
  report: <IconReport />,
};

const NAV_LABELS: Record<TabId, string> = {
  scanner: "스캐너",
  results: "결과",
  report: "보고서",
};

const NAV_DESCS: Record<TabId, string> = {
  scanner: "자동 광고 모니터링",
  results: "스캔 결과 목록 & 분석",
  report: "종합 보고서 생성",
};

const NAV_MOBILE_ICONS: Record<TabId, string> = {
  scanner: "🔍",
  results: "📊",
  report: "📋",
};

// ── 로고 ─────────────────────────────────────────────────────────
const LogoIcon = () => (
  <div style={{
    width: 38, height: 38, borderRadius: 11,
    background: "linear-gradient(135deg,#7C3AED,#3B82F6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 4px 14px rgba(124,58,237,0.4)",
  }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      <line x1="8" y1="11" x2="14" y2="11"/>
      <line x1="11" y1="8" x2="11" y2="14"/>
    </svg>
  </div>
);

// ── 앱 ───────────────────────────────────────────────────────────
const App: React.FC = () => {
  const [tab, setTab] = useState<TabId>("scanner");
  const [results, setResults] = useState<ScanResult[]>([]);
  const [lastKeyword, setLastKeyword] = useState("");

  const handleResult = useCallback((result: ScanResult) => {
    setResults((prev) => {
      const exists = prev.find((r) => r.url === result.url);
      if (exists) return prev;
      return [result, ...prev];
    });
  }, []);

  const handleClear = () => setResults([]);

  const stats = {
    total: results.length,
    violation: results.filter((r) => r.status === "violation").length,
    warning: results.filter((r) => r.status === "warning").length,
    clean: results.filter((r) => r.status === "clean").length,
  };

  return (
    <div className="app-layout">
      {/* ── 배경 글로우 ── */}
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />

      {/* ════════════════════════════════════════
          사이드바 (데스크탑)
      ════════════════════════════════════════ */}
      <aside className="sidebar slide-in-left">
        {/* 로고 */}
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <LogoIcon />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#E2E8F0", letterSpacing: "-0.3px" }}>
                AdWatch
              </div>
              <div style={{ fontSize: 10.5, color: "#64748B", marginTop: 1 }}>
                변호사 광고 모니터링
              </div>
            </div>
          </div>
        </div>

        {/* 네비게이션 */}
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 8px", marginBottom: 4 }}>
            메뉴
          </div>

          {TABS.map((t) => (
            <button
              key={t.id}
              className={`sidebar-nav-item${tab === t.id ? " active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <span className="nav-icon" style={{ fontSize: 18, lineHeight: 1, width: 22, textAlign: "center", flexShrink: 0 }}>
                {NAV_MOBILE_ICONS[t.id]}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.3 }}>
                  {NAV_LABELS[t.id]}
                </div>
                <div style={{ fontSize: 11, color: tab === t.id ? "rgba(226,232,240,0.6)" : "#475569", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {NAV_DESCS[t.id]}
                </div>
              </div>
              {/* 결과 탭 배지 */}
              {t.id === "results" && results.length > 0 && (
                <span style={{
                  padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 800,
                  background: tab === t.id ? "rgba(255,255,255,0.15)" : "rgba(59,130,246,0.2)",
                  color: tab === t.id ? "#fff" : "#93C5FD",
                  flexShrink: 0,
                }}>
                  {results.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Pro 업그레이드 배너 */}
        <div style={{ padding: "0 12px 24px" }}>
          <div className="pro-banner">
            <div style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Pro 플랜
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0", marginBottom: 6 }}>
              더 많은 기능 잠금 해제
            </div>
            <div style={{ fontSize: 11.5, color: "#94A3B8", lineHeight: 1.5, marginBottom: 12 }}>
              무제한 스캔 · 자동 스케줄링 · API 연동 · 팀 공유
            </div>
            <button style={{
              width: "100%", padding: "9px", borderRadius: 9, border: "none",
              background: "linear-gradient(135deg,#7C3AED,#3B82F6)",
              color: "#fff", fontSize: 12.5, fontWeight: 700,
              fontFamily: "var(--font)", cursor: "pointer",
              boxShadow: "0 3px 10px rgba(124,58,237,0.35)",
              transition: "opacity 0.2s",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              업그레이드 →
            </button>
          </div>
        </div>
      </aside>

      {/* ════════════════════════════════════════
          메인 래퍼
      ════════════════════════════════════════ */}
      <div className="main-wrapper">

        {/* ── 상단 헤더바 ── */}
        <header className="top-header">
          {/* 페이지 타이틀 */}
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#E2E8F0", margin: 0 }}>
              {NAV_LABELS[tab]}
            </h2>
            <p style={{ fontSize: 11.5, color: "#64748B", margin: 0, marginTop: 1 }}>
              {NAV_DESCS[tab]}
            </p>
          </div>

          {/* 실시간 통계 배지 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {stats.total === 0 ? (
              <span style={{
                padding: "5px 12px", borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                background: "rgba(255,255,255,0.04)", color: "#475569",
                border: "1px solid rgba(255,255,255,0.06)",
              }}>
                스캔 대기 중
              </span>
            ) : (
              <>
                {stats.violation > 0 && (
                  <span className="badge-violation" style={{ fontSize: 11.5 }}>
                    위반 {stats.violation}
                  </span>
                )}
                {stats.warning > 0 && (
                  <span className="badge-warning" style={{ fontSize: 11.5 }}>
                    주의 {stats.warning}
                  </span>
                )}
                {stats.clean > 0 && (
                  <span className="badge-clean" style={{ fontSize: 11.5 }}>
                    적법 {stats.clean}
                  </span>
                )}
                <span style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: 11.5, fontWeight: 700,
                  background: "rgba(255,255,255,0.05)", color: "#94A3B8",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}>
                  총 {stats.total}건
                </span>
              </>
            )}
          </div>
        </header>

        {/* ── 메인 콘텐츠 ── */}
        <main className="content-area" style={{ position: "relative", zIndex: 1 }}>
          {tab === "scanner" && (
            <ScannerPanel onResult={handleResult} onKeywordChange={setLastKeyword} />
          )}
          {tab === "results" && (
            <ResultsPanel results={results} onClear={handleClear} />
          )}
          {tab === "report" && (
            <ReportPanel results={results} keyword={lastKeyword} />
          )}
        </main>

        {/* ── 푸터 ── */}
        <footer style={{
          textAlign: "center", padding: "16px 24px", fontSize: 11,
          color: "#334155", borderTop: "1px solid rgba(255,255,255,0.04)",
          background: "rgba(10,10,15,0.5)",
        }}>
          AI 기반 참고용 분석입니다. 최종 판단은 변호사에게 확인하세요.
          &nbsp;|&nbsp; 대한변호사협회 광고규정 (2025.2.6. 개정) 기반
        </footer>
      </div>

      {/* ════════════════════════════════════════
          모바일 하단 탭바
      ════════════════════════════════════════ */}
      <nav className="mobile-tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`mobile-tab-btn${tab === t.id ? " active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-icon">{NAV_MOBILE_ICONS[t.id]}</span>
            <span>{NAV_LABELS[t.id]}</span>
            {t.id === "results" && results.length > 0 && (
              <span style={{
                position: "absolute", top: 6, right: "calc(50% - 18px)",
                width: 16, height: 16, borderRadius: 8,
                background: "linear-gradient(135deg,#7C3AED,#3B82F6)",
                color: "#fff", fontSize: 9, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {results.length > 9 ? "9+" : results.length}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
