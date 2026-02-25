import React, { useState } from "react";
import type { ScanResult, SearchItem } from "../types";
import { scanUrl, searchKeyword } from "../services/api";
import { EXAMPLE_KEYWORDS } from "../data/constants";

interface Props {
  onResult: (result: ScanResult) => void;
}

const ScannerPanel: React.FC<Props> = ({ onResult }) => {
  const [mode, setMode] = useState<"url" | "keyword">("url");
  const [urlInput, setUrlInput] = useState("");
  const [kwInput, setKwInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [scanningUrl, setScanningUrl] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // ── 단일 URL 스캔 ──
  const handleUrlScan = async () => {
    if (!urlInput.trim() || loading) return;
    setLoading(true);
    setError("");
    setScanningUrl(urlInput.trim());
    try {
      const result = await scanUrl(urlInput.trim());
      onResult(result);
      setUrlInput("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "스캔 실패");
    } finally {
      setLoading(false);
      setScanningUrl("");
    }
  };

  // ── 키워드 검색 ──
  const handleSearch = async () => {
    if (!kwInput.trim() || loading) return;
    setLoading(true);
    setError("");
    setSearchResults([]);
    try {
      const items = await searchKeyword(kwInput.trim());
      if (items.length === 0) {
        setError("검색 결과가 없습니다. 네이버 API 키가 설정되어 있는지 확인하세요.");
      } else {
        setSearchResults(items);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "검색 실패");
    } finally {
      setLoading(false);
    }
  };

  // ── 검색 결과 일괄 스캔 ──
  const handleBatchScan = async () => {
    if (searchResults.length === 0 || loading) return;
    setLoading(true);
    setError("");
    setProgress({ current: 0, total: searchResults.length });

    for (let i = 0; i < searchResults.length; i++) {
      const item = searchResults[i];
      setScanningUrl(item.link);
      setProgress({ current: i + 1, total: searchResults.length });
      try {
        const result = await scanUrl(item.link);
        onResult(result);
      } catch (err: unknown) {
        console.error(`스캔 실패: ${item.link}`, err);
      }
      // 속도 제한 (1초 간격)
      if (i < searchResults.length - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    setLoading(false);
    setScanningUrl("");
    setSearchResults([]);
    setProgress({ current: 0, total: 0 });
  };

  const s = {
    card: {
      background: "var(--c-surface)", borderRadius: 14,
      border: "1px solid var(--c-border)", padding: 20, marginBottom: 16,
    } as React.CSSProperties,
    input: {
      width: "100%", padding: "12px 16px", fontSize: 14, fontFamily: "inherit",
      border: "1.5px solid var(--c-border)", borderRadius: 10,
      background: "#FAFAF7", color: "var(--c-text)",
    } as React.CSSProperties,
    btn: (active: boolean) => ({
      padding: "10px 20px", borderRadius: 10, border: "none", fontSize: 14,
      fontWeight: 700, fontFamily: "inherit", cursor: active ? "pointer" : "default",
      background: active ? "var(--c-primary-l)" : "#D4C8B8",
      color: active ? "#FFF" : "#999", transition: "all .2s",
    } as React.CSSProperties),
    tab: (active: boolean) => ({
      padding: "8px 18px", borderRadius: 8, border: "none", fontSize: 13,
      fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
      background: active ? "var(--c-primary-l)" : "transparent",
      color: active ? "#FFF" : "var(--c-muted)", transition: "all .2s",
    } as React.CSSProperties),
  };

  return (
    <div className="slide-up">
      {/* 모드 선택 탭 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, background: "#F0EBE3", borderRadius: 10, padding: 4 }}>
        <button style={s.tab(mode === "url")} onClick={() => setMode("url")}>
          🔗 URL 직접 입력
        </button>
        <button style={s.tab(mode === "keyword")} onClick={() => setMode("keyword")}>
          🔍 키워드 검색
        </button>
      </div>

      {/* URL 모드 */}
      {mode === "url" && (
        <div style={s.card}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
            📎 URL을 입력하면 해당 페이지의 광고 위반 여부를 분석합니다
          </h3>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              style={s.input}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUrlScan()}
              placeholder="https://blog.naver.com/example..."
              disabled={loading}
            />
            <button style={s.btn(!loading && !!urlInput.trim())} onClick={handleUrlScan} disabled={loading}>
              {loading ? "⏳" : "스캔"}
            </button>
          </div>
        </div>
      )}

      {/* 키워드 모드 */}
      {mode === "keyword" && (
        <div style={s.card}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
            🔍 키워드로 네이버 블로그를 검색하고 일괄 분석합니다
          </h3>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <input
              style={s.input}
              value={kwInput}
              onChange={(e) => setKwInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="예: 이혼변호사 부산"
              disabled={loading}
            />
            <button style={s.btn(!loading && !!kwInput.trim())} onClick={handleSearch} disabled={loading}>
              {loading && searchResults.length === 0 ? "⏳" : "검색"}
            </button>
          </div>

          {/* 예시 키워드 */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {EXAMPLE_KEYWORDS.map((kw) => (
              <button
                key={kw}
                onClick={() => { setKwInput(kw); }}
                style={{
                  padding: "5px 12px", borderRadius: 16, border: "1px solid var(--c-border)",
                  background: "#FAFAF7", fontSize: 12, color: "var(--c-muted)",
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {kw}
              </button>
            ))}
          </div>

          {/* 검색 결과 목록 */}
          {searchResults.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: "var(--c-muted)" }}>
                  {searchResults.length}개 결과 발견
                </span>
                <button style={s.btn(true)} onClick={handleBatchScan}>
                  🚀 전체 스캔 시작
                </button>
              </div>
              {searchResults.map((item, i) => (
                <div key={i} style={{
                  padding: "10px 14px", borderBottom: "1px solid #F0EBE3",
                  fontSize: 13,
                }}>
                  <div style={{ fontWeight: 600, color: "var(--c-text)", marginBottom: 3 }}>
                    {item.title}
                  </div>
                  <div style={{ color: "var(--c-accent)", fontSize: 11, wordBreak: "break-all" }}>
                    {item.link}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 로딩 / 진행 상태 */}
      {loading && scanningUrl && (
        <div style={{
          ...s.card, background: "#FFF9F0", borderColor: "#E8DFD2",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 20, height: 20, border: "2.5px solid var(--c-border)",
            borderTopColor: "var(--c-accent)", borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {progress.total > 0
                ? `스캔 중... (${progress.current}/${progress.total})`
                : "스캔 중..."}
            </div>
            <div style={{ fontSize: 11, color: "var(--c-muted)", wordBreak: "break-all" }}>
              {scanningUrl}
            </div>
          </div>
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div style={{
          ...s.card, background: "#FEF2F2", borderColor: "#FECACA",
          color: "#B91C1C", fontSize: 13,
        }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

export default ScannerPanel;
