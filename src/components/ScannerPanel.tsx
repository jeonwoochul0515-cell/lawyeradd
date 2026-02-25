import React, { useState, useRef, useEffect } from "react";
import type { ScanResult, SearchItem } from "../types";
import { scanUrl, searchKeyword } from "../services/api";
import { EXAMPLE_KEYWORDS } from "../data/constants";

interface Props {
  onResult: (result: ScanResult) => void;
  onKeywordChange?: (keyword: string) => void;
}

// ── 히스토리 아이템 타입 ──────────────────────────────────────
interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  status: "clean" | "warning" | "violation";
  scannedAt: string;
}

// ── 상태 배지 컴포넌트 ────────────────────────────────────────
const StatusBadge: React.FC<{ status: "clean" | "warning" | "violation" }> = ({ status }) => {
  const map = {
    violation: { cls: "badge-violation", label: "위반", dot: "#EF4444" },
    warning:   { cls: "badge-warning",   label: "주의", dot: "#F59E0B" },
    clean:     { cls: "badge-clean",     label: "적법", dot: "#22C55E" },
  };
  const cfg = map[status];
  return (
    <span className={cfg.cls}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
};

// ── 빈 상태 아이콘 ────────────────────────────────────────────
const ScanReadyIllustration = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="32" r="32" fill="rgba(124,58,237,0.08)"/>
    <circle cx="30" cy="29" r="12" stroke="url(#sg)" strokeWidth="2.5" fill="none"/>
    <line x1="39" y1="38" x2="48" y2="47" stroke="url(#sg)" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M26 29h8M30 25v8" stroke="url(#sg)" strokeWidth="2" strokeLinecap="round"/>
    <defs>
      <linearGradient id="sg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7C3AED"/>
        <stop offset="0.5" stopColor="#3B82F6"/>
        <stop offset="1" stopColor="#06B6D4"/>
      </linearGradient>
    </defs>
  </svg>
);

const KeywordReadyIllustration = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="32" r="32" fill="rgba(59,130,246,0.08)"/>
    <rect x="14" y="20" width="36" height="6" rx="3" fill="url(#kg)" opacity="0.8"/>
    <rect x="14" y="30" width="28" height="6" rx="3" fill="url(#kg)" opacity="0.5"/>
    <rect x="14" y="40" width="20" height="6" rx="3" fill="url(#kg)" opacity="0.3"/>
    <defs>
      <linearGradient id="kg" x1="14" y1="0" x2="50" y2="0" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3B82F6"/>
        <stop offset="1" stopColor="#06B6D4"/>
      </linearGradient>
    </defs>
  </svg>
);

// ── 메인 컴포넌트 ─────────────────────────────────────────────
const ScannerPanel: React.FC<Props> = ({ onResult, onKeywordChange }) => {
  const [mode, setMode] = useState<"url" | "keyword">("url");
  const [urlInput, setUrlInput] = useState("");
  const [kwInput, setKwInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [scanningUrl, setScanningUrl] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [scanSuccess, setScanSuccess] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const kwInputRef = useRef<HTMLInputElement>(null);

  // 모드 전환 시 포커스
  useEffect(() => {
    if (mode === "url") urlInputRef.current?.focus();
    else kwInputRef.current?.focus();
  }, [mode]);

  // ── 단일 URL 스캔 ──────────────────────────────────────────
  const handleUrlScan = async () => {
    if (!urlInput.trim() || loading) return;
    setLoading(true);
    setError("");
    setScanSuccess(false);
    setScanningUrl(urlInput.trim());
    setProgress({ current: 0, total: 1 });
    try {
      const result = await scanUrl(urlInput.trim());
      onResult(result);
      setHistory((prev) => [{
        id: result.id,
        url: result.url,
        title: result.title || result.url,
        status: result.status,
        scannedAt: result.scannedAt,
      }, ...prev.slice(0, 9)]);
      setScanSuccess(true);
      setUrlInput("");
      setProgress({ current: 1, total: 1 });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "스캔 실패");
    } finally {
      setLoading(false);
      setScanningUrl("");
      setTimeout(() => { setScanSuccess(false); setProgress({ current: 0, total: 0 }); }, 2500);
    }
  };

  // ── 키워드 검색 ────────────────────────────────────────────
  const handleSearch = async () => {
    if (!kwInput.trim() || loading) return;
    setLoading(true);
    setError("");
    setSearchItems([]);
    setSelectedItems(new Set());
    onKeywordChange?.(kwInput.trim());
    try {
      const items = await searchKeyword(kwInput.trim());
      if (items.length === 0) {
        setError("검색 결과가 없습니다. 네이버 API 키 설정을 확인하세요.");
      } else {
        setSearchItems(items);
        setSelectedItems(new Set(items.map((_, i) => i)));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "검색 실패");
    } finally {
      setLoading(false);
    }
  };

  // ── 선택 항목 일괄 스캔 ───────────────────────────────────
  const handleBatchScan = async () => {
    const targets = searchItems.filter((_, i) => selectedItems.has(i));
    if (targets.length === 0 || loading) return;
    setLoading(true);
    setError("");
    setProgress({ current: 0, total: targets.length });
    const newHistory: HistoryEntry[] = [];

    for (let i = 0; i < targets.length; i++) {
      const item = targets[i];
      setScanningUrl(item.link);
      setProgress({ current: i + 1, total: targets.length });
      try {
        const result = await scanUrl(item.link);
        onResult(result);
        newHistory.push({
          id: result.id, url: result.url,
          title: result.title || item.title || item.link,
          status: result.status, scannedAt: result.scannedAt,
        });
      } catch (err: unknown) {
        console.error(`스캔 실패: ${item.link}`, err);
      }
      if (i < targets.length - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    setHistory((prev) => [...newHistory, ...prev].slice(0, 10));
    setLoading(false);
    setScanningUrl("");
    setSearchItems([]);
    setSelectedItems(new Set());
    setProgress({ current: 0, total: 0 });
  };

  // ── 전체 선택 토글 ────────────────────────────────────────
  const toggleAll = () => {
    if (selectedItems.size === searchItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(searchItems.map((_, i) => i)));
    }
  };
  const toggleItem = (i: number) => {
    const next = new Set(selectedItems);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelectedItems(next);
  };

  // ── 진행률 ────────────────────────────────────────────────
  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const estimatedSec = progress.total > 0 ? (progress.total - progress.current) * 1.2 : 0;

  // ── 스트립 헬퍼 (HTML 태그 제거) ─────────────────────────
  const stripHtml = (s: string) => s.replace(/<[^>]*>/g, "");

  return (
    <div className="slide-up" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ────────────────────────────────────────────────────
          1. 모드 세그먼트 컨트롤
      ──────────────────────────────────────────────────── */}
      <div className="segment-control">
        <button
          className={`segment-btn${mode === "url" ? " active" : ""}`}
          onClick={() => { setMode("url"); setError(""); }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          URL 직접 입력
        </button>
        <button
          className={`segment-btn${mode === "keyword" ? " active" : ""}`}
          onClick={() => { setMode("keyword"); setError(""); }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          키워드 검색
        </button>
      </div>

      {/* ────────────────────────────────────────────────────
          2a. URL 모드
      ──────────────────────────────────────────────────── */}
      {mode === "url" && (
        <div className="glass-card" style={{ padding: 24 }}>
          {/* 헤더 */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#E2E8F0", marginBottom: 5 }}>
              URL 광고 위반 분석
            </h3>
            <p style={{ fontSize: 12.5, color: "#64748B", lineHeight: 1.5 }}>
              분석하려는 변호사 광고 페이지 URL을 입력하세요. 크롤링 후 AI가 위반 조항을 탐지합니다.
            </p>
          </div>

          {/* 입력 + 버튼 */}
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <div style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                color: "#475569", pointerEvents: "none",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </div>
              <input
                ref={urlInputRef}
                className="input-field"
                style={{ paddingLeft: 42 }}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUrlScan()}
                placeholder="https://blog.naver.com/lawyer-example"
                disabled={loading}
              />
            </div>
            <button
              className="btn-primary"
              style={{ minWidth: 100, flexShrink: 0 }}
              onClick={handleUrlScan}
              disabled={loading || !urlInput.trim()}
            >
              {loading ? (
                <><div className="spinner" style={{ width: 15, height: 15 }} />분석 중</>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  스캔 시작
                </>
              )}
            </button>
          </div>

          {/* 성공 메시지 */}
          {scanSuccess && !loading && (
            <div style={{
              marginTop: 14, padding: "10px 14px", borderRadius: 10,
              background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
              fontSize: 13, color: "#4ADE80", display: "flex", alignItems: "center", gap: 8,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              스캔 완료! 결과 탭에서 확인하세요.
            </div>
          )}

          {/* 빈 상태 일러스트 */}
          {!loading && !scanSuccess && history.length === 0 && (
            <div className="empty-state" style={{ padding: "32px 0 8px" }}>
              <div className="empty-icon-wrap">
                <ScanReadyIllustration />
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#94A3B8", marginBottom: 6 }}>
                URL을 입력하고 스캔을 시작하세요
              </p>
              <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.6, maxWidth: 280 }}>
                네이버 블로그, 법무법인 홈페이지 등 변호사 광고가 포함된 URL을 붙여넣으세요
              </p>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────
          2b. 키워드 모드
      ──────────────────────────────────────────────────── */}
      {mode === "keyword" && (
        <div className="glass-card" style={{ padding: 24 }}>
          {/* 헤더 */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#E2E8F0", marginBottom: 5 }}>
              키워드 일괄 검색 및 스캔
            </h3>
            <p style={{ fontSize: 12.5, color: "#64748B", lineHeight: 1.5 }}>
              키워드로 네이버 블로그를 검색하고, 결과 목록에서 원하는 페이지를 선택해 일괄 분석합니다.
            </p>
          </div>

          {/* 입력 + 검색 버튼 */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <div style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                color: "#475569", pointerEvents: "none",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <input
                ref={kwInputRef}
                className="input-field"
                style={{ paddingLeft: 42 }}
                value={kwInput}
                onChange={(e) => setKwInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="예: 이혼변호사 서울, 형사전문 변호사"
                disabled={loading}
              />
            </div>
            <button
              className="btn-primary"
              style={{ minWidth: 90, flexShrink: 0 }}
              onClick={handleSearch}
              disabled={loading || !kwInput.trim()}
            >
              {loading && searchItems.length === 0 ? (
                <><div className="spinner" style={{ width: 15, height: 15 }} />검색 중</>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  검색
                </>
              )}
            </button>
          </div>

          {/* 예시 키워드 칩 */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              예시 키워드
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {EXAMPLE_KEYWORDS.map((kw) => (
                <button
                  key={kw}
                  className="keyword-chip"
                  onClick={() => { setKwInput(kw); kwInputRef.current?.focus(); }}
                  disabled={loading}
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>

          {/* 검색 결과 목록 */}
          {searchItems.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div className="divider" />

              {/* 결과 헤더 */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
                    <input
                      type="checkbox"
                      className="custom-checkbox"
                      checked={selectedItems.size === searchItems.length}
                      onChange={toggleAll}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#94A3B8" }}>
                      전체 선택
                    </span>
                  </label>
                  <span style={{
                    padding: "3px 9px", borderRadius: 12, fontSize: 11.5, fontWeight: 700,
                    background: "rgba(59,130,246,0.12)", color: "#60A5FA",
                    border: "1px solid rgba(59,130,246,0.2)",
                  }}>
                    {searchItems.length}개 발견
                  </span>
                </div>

                <button
                  className="btn-primary"
                  style={{ padding: "9px 18px", fontSize: 13 }}
                  onClick={handleBatchScan}
                  disabled={loading || selectedItems.size === 0}
                >
                  {loading ? (
                    <><div className="spinner" style={{ width: 14, height: 14 }} />스캔 중</>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                      {selectedItems.size}개 스캔
                    </>
                  )}
                </button>
              </div>

              {/* 결과 아이템 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 340, overflowY: "auto", paddingRight: 4 }}>
                {searchItems.map((item, i) => (
                  <div
                    key={i}
                    className={`search-result-item${selectedItems.has(i) ? " selected" : ""}`}
                    onClick={() => toggleItem(i)}
                  >
                    <input
                      type="checkbox"
                      className="custom-checkbox"
                      checked={selectedItems.has(i)}
                      onChange={() => toggleItem(i)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 600, color: "#E2E8F0",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        marginBottom: 3,
                      }}>
                        {stripHtml(item.title) || "(제목 없음)"}
                      </div>
                      <div style={{
                        fontSize: 11, color: "#3B82F6",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        marginBottom: 3,
                      }}>
                        {item.link}
                      </div>
                      {item.description && (
                        <div style={{
                          fontSize: 11.5, color: "#475569", lineHeight: 1.5,
                          overflow: "hidden", textOverflow: "ellipsis",
                          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                        }}>
                          {stripHtml(item.description)}
                        </div>
                      )}
                    </div>
                    <div style={{ flexShrink: 0, color: "#334155" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 빈 상태 */}
          {!loading && searchItems.length === 0 && (
            <div className="empty-state" style={{ padding: "32px 0 8px" }}>
              <div className="empty-icon-wrap">
                <KeywordReadyIllustration />
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#94A3B8", marginBottom: 6 }}>
                키워드를 입력하고 검색하세요
              </p>
              <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.6, maxWidth: 280 }}>
                위 예시 키워드를 클릭하거나 직접 입력 후 검색 버튼을 눌러 광고를 일괄 분석하세요
              </p>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────
          3. 스캔 진행 상태 카드
      ──────────────────────────────────────────────────── */}
      {loading && scanningUrl && (
        <div className="scan-progress-card slide-up">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="spinner" />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#E2E8F0" }}>
                  {progress.total > 1
                    ? `스캔 중 (${progress.current} / ${progress.total})`
                    : "스캔 중..."}
                </div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                  AI가 광고 내용을 분석하고 있습니다
                </div>
              </div>
            </div>
            {progress.total > 1 && estimatedSec > 0 && (
              <div style={{ fontSize: 11.5, color: "#7C3AED", fontWeight: 600 }}>
                약 {estimatedSec < 60 ? `${Math.ceil(estimatedSec)}초` : `${Math.ceil(estimatedSec / 60)}분`} 남음
              </div>
            )}
          </div>

          {/* 프로그레스 바 */}
          {progress.total > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <div style={{ fontSize: 11, color: "#475569", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {scanningUrl}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", flexShrink: 0, marginLeft: 8 }}>
                  {pct}%
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────
          4. 에러 메시지
      ──────────────────────────────────────────────────── */}
      {error && (
        <div className="fade-in" style={{
          padding: "14px 18px", borderRadius: 12,
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#FCA5A5", marginBottom: 3 }}>
              오류 발생
            </div>
            <div style={{ fontSize: 12.5, color: "#EF4444", lineHeight: 1.5 }}>
              {error}
            </div>
          </div>
          <button
            onClick={() => setError("")}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#7F1D1D", flexShrink: 0, padding: "0 0 0 8px" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* ────────────────────────────────────────────────────
          5. 최근 스캔 히스토리
      ──────────────────────────────────────────────────── */}
      {history.length > 0 && (
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="12 8 12 12 14 14"/>
                <path d="M3.05 11a9 9 0 1 1 .5 4M3 21v-4h4"/>
              </svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8" }}>
                최근 스캔 히스토리
              </span>
            </div>
            <button
              onClick={() => setHistory([])}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#475569", fontFamily: "var(--font)" }}
            >
              전체 지우기
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {history.map((h, i) => (
              <div key={h.id} className="history-item" style={{ marginBottom: i < history.length - 1 ? 6 : 0 }}>
                <StatusBadge status={h.status} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "#CBD5E1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {h.title}
                  </div>
                  <div style={{ fontSize: 11, color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {h.url}
                  </div>
                </div>
                <div style={{ fontSize: 10.5, color: "#334155", flexShrink: 0 }}>
                  {new Date(h.scannedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScannerPanel;
