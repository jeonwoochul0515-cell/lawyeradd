import React, { useState, useCallback } from "react";
import { ScannerPanel, ResultsPanel, ReportPanel } from "./components";
import { TABS } from "./data/constants";
import type { ScanResult, TabId } from "./types";

const App: React.FC = () => {
  const [tab, setTab] = useState<TabId>("scanner");
  const [results, setResults] = useState<ScanResult[]>([]);
  const [lastKeyword, setLastKeyword] = useState("");

  // 스캔 결과 추가
  const handleResult = useCallback((result: ScanResult) => {
    setResults((prev) => {
      // 중복 URL 방지
      const exists = prev.find((r) => r.url === result.url);
      if (exists) return prev;
      return [result, ...prev];
    });
  }, []);

  // 결과 초기화
  const handleClear = () => setResults([]);

  // 통계
  const stats = {
    total: results.length,
    violation: results.filter((r) => r.status === "violation").length,
    warning: results.filter((r) => r.status === "warning").length,
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ── 헤더 ── */}
      <header style={{
        background: "linear-gradient(135deg, #3A2E22, #5C4033)",
        padding: "18px 20px", color: "#FFF8F0",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 4px 20px rgba(58,46,34,0.3)",
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 11,
                background: "rgba(255,248,240,0.14)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
              }}>🔍</div>
              <div>
                <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: "-0.4px" }}>
                  광고 규정 모니터링
                </h1>
                <p style={{ margin: 0, fontSize: 11.5, opacity: 0.65, marginTop: 2 }}>
                  변호사 광고 자동 크롤링 · AI 위반 탐지 · 보고서 생성
                </p>
              </div>
            </div>

            {/* 실시간 배지 */}
            {stats.total > 0 && (
              <div style={{ display: "flex", gap: 8 }}>
                {stats.violation > 0 && (
                  <span style={{
                    padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                    background: "rgba(239,68,68,0.2)", color: "#FCA5A5",
                  }}>
                    ❌ {stats.violation}
                  </span>
                )}
                {stats.warning > 0 && (
                  <span style={{
                    padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                    background: "rgba(234,179,8,0.2)", color: "#FDE047",
                  }}>
                    ⚠️ {stats.warning}
                  </span>
                )}
                <span style={{
                  padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                  background: "rgba(255,248,240,0.14)", color: "#FFF8F0",
                }}>
                  📊 {stats.total}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── 탭 네비게이션 ── */}
      <div style={{
        background: "var(--c-surface)", borderBottom: "1px solid var(--c-border)",
        position: "sticky", top: 78, zIndex: 99,
      }}>
        <div style={{
          maxWidth: 800, margin: "0 auto", display: "flex", padding: "0 16px",
        }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "14px 20px", border: "none", background: "transparent",
                fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
                color: tab === t.id ? "var(--c-primary)" : "var(--c-muted)",
                borderBottom: tab === t.id ? "2.5px solid var(--c-primary-l)" : "2.5px solid transparent",
                transition: "all .2s",
              }}
            >
              {t.label}
              {t.id === "results" && results.length > 0 && (
                <span style={{
                  marginLeft: 6, padding: "1px 7px", borderRadius: 10,
                  fontSize: 11, fontWeight: 700,
                  background: tab === t.id ? "var(--c-primary-l)" : "#E8DFD2",
                  color: tab === t.id ? "#FFF" : "var(--c-muted)",
                }}>
                  {results.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── 콘텐츠 ── */}
      <main style={{ flex: 1, maxWidth: 800, width: "100%", margin: "0 auto", padding: "20px 16px" }}>
        {tab === "scanner" && <ScannerPanel onResult={handleResult} />}
        {tab === "results" && <ResultsPanel results={results} onClear={handleClear} />}
        {tab === "report" && <ReportPanel results={results} keyword={lastKeyword} />}
      </main>

      {/* ── 푸터 ── */}
      <footer style={{
        textAlign: "center", padding: "16px", fontSize: 11,
        color: "var(--c-muted)", borderTop: "1px solid var(--c-border)",
      }}>
        ⚠️ AI 기반 참고용 분석입니다. 최종 판단은 변호사에게 확인하세요.
        &nbsp;|&nbsp; 대한변호사협회 광고규정 (2025.2.6. 개정) 기반
      </footer>
    </div>
  );
};

export default App;
