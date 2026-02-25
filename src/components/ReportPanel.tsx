import React, { useState, useRef } from "react";
import type { ScanResult } from "../types";
import { generateReportText, generateCSV } from "../services/api";

interface Props {
  results: ScanResult[];
  keyword: string;
}

// ─── 아이콘 ──────────────────────────────────────────────────────────────────
const IconFileText = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconTable = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </svg>
);

const IconClipboard = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

const IconDownload = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconCheck = ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconLock = ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const IconStar = ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconZap = ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconReport = ({ size = 48, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
);

const IconShield = ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// ─── 복사 성공 피드백 훅 ─────────────────────────────────────────────────────
function useCopyFeedback(duration = 2000) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trigger = () => {
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), duration);
  };

  return { copied, trigger };
}

// ─── 비율 바 컴포넌트 ─────────────────────────────────────────────────────────
const RatioBar: React.FC<{
  violation: number;
  warning: number;
  clean: number;
  total: number;
}> = ({ violation, warning, clean, total }) => {
  if (total === 0) return null;
  const vPct = Math.round((violation / total) * 100);
  const wPct = Math.round((warning / total) * 100);
  const cPct = 100 - vPct - wPct;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {/* 비율 바 */}
      <div
        style={{
          display: "flex",
          height: 10,
          borderRadius: 10,
          overflow: "hidden",
          background: "rgba(255,255,255,0.05)",
          gap: 2,
        }}
      >
        {vPct > 0 && (
          <div
            style={{
              width: `${vPct}%`,
              background: "linear-gradient(90deg, #EF4444, #F87171)",
              borderRadius: "10px 0 0 10px",
              transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        )}
        {wPct > 0 && (
          <div
            style={{
              width: `${wPct}%`,
              background: "linear-gradient(90deg, #F59E0B, #FCD34D)",
              transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        )}
        {cPct > 0 && (
          <div
            style={{
              width: `${cPct}%`,
              background: "linear-gradient(90deg, #22C55E, #4ADE80)",
              borderRadius: "0 10px 10px 0",
              transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        )}
      </div>

      {/* 범례 */}
      <div style={{ display: "flex", gap: 14, justifyContent: "flex-end" }}>
        {[
          { color: "#EF4444", label: "위반", pct: vPct },
          { color: "#F59E0B", label: "주의", pct: wPct },
          { color: "#22C55E", label: "적법", pct: cPct },
        ].map(({ color, label, pct }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 10.5, color: "#64748B", fontWeight: 600 }}>
              {label} {pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── CSS 도넛 차트 ────────────────────────────────────────────────────────────
const DonutRing: React.FC<{
  violation: number;
  warning: number;
  clean: number;
  total: number;
}> = ({ violation, warning, clean, total }) => {
  if (total === 0) return null;

  const SIZE = 100;
  const STROKE = 12;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;
  const CENTER = SIZE / 2;

  const vPct = violation / total;
  const wPct = warning / total;
  const cPct = clean / total;

  // 각 호의 strokeDasharray, strokeDashoffset 계산
  const segments = [
    { pct: vPct, color: "#EF4444", label: "위반" },
    { pct: wPct, color: "#F59E0B", label: "주의" },
    { pct: cPct, color: "#22C55E", label: "적법" },
  ];

  let cumulative = 0;
  const paths = segments
    .filter((s) => s.pct > 0)
    .map((s) => {
      const dash = s.pct * CIRC;
      const gap = CIRC - dash;
      const offset = CIRC * (1 - cumulative) - CIRC * 0.25; // -0.25 to start from top
      cumulative += s.pct;
      return { ...s, dash, gap, offset };
    });

  // 위험도 점수 (위반 * 100 + 주의 * 40 기준)
  const riskScore = total > 0 ? Math.min(100, Math.round(((violation * 100 + warning * 40) / (total * 100)) * 100)) : 0;
  const riskLabel = riskScore >= 60 ? "높음" : riskScore >= 30 ? "보통" : "낮음";
  const riskColor = riskScore >= 60 ? "#EF4444" : riskScore >= 30 ? "#F59E0B" : "#22C55E";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      {/* SVG 도넛 */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* 배경 원 */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={STROKE}
          />
          {/* 데이터 호 */}
          {paths.map((p, i) => (
            <circle
              key={i}
              cx={CENTER}
              cy={CENTER}
              r={R}
              fill="none"
              stroke={p.color}
              strokeWidth={STROKE}
              strokeDasharray={`${p.dash} ${p.gap}`}
              strokeDashoffset={p.offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }}
              transform={`rotate(-90, ${CENTER}, ${CENTER})`}
            />
          ))}
        </svg>
        {/* 중앙 텍스트 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 19,
              fontWeight: 800,
              color: riskColor,
              lineHeight: 1,
              letterSpacing: "-0.5px",
            }}
          >
            {riskScore}
          </span>
          <span style={{ fontSize: 9, color: "#64748B", fontWeight: 600, marginTop: 2 }}>
            위험도
          </span>
        </div>
      </div>

      {/* 범례 + 수치 */}
      <div style={{ flex: 1 }}>
        <div style={{ marginBottom: 8 }}>
          <span
            style={{
              fontSize: 11,
              color: "#64748B",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            위험도 레벨
          </span>
          <span
            style={{
              marginLeft: 8,
              fontSize: 12,
              fontWeight: 700,
              color: riskColor,
              padding: "1px 8px",
              borderRadius: 6,
              background: `${riskColor}15`,
              border: `1px solid ${riskColor}30`,
            }}
          >
            {riskLabel}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {[
            { count: violation, label: "위반", color: "#EF4444" },
            { count: warning, label: "주의", color: "#F59E0B" },
            { count: clean, label: "적법", color: "#22C55E" },
          ].map(({ count, label, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 12, color: "#94A3B8", flex: 1 }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>
                {count}
              </span>
              <span style={{ fontSize: 11, color: "#475569", minWidth: 32, textAlign: "right" }}>
                {total > 0 ? Math.round((count / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
const ReportPanel: React.FC<Props> = ({ results, keyword }) => {
  const [reportText, setReportText] = useState("");
  const [generating, setGenerating] = useState(false);
  const { copied, trigger: triggerCopy } = useCopyFeedback();

  const violations = results.filter((r) => r.status === "violation").length;
  const warnings = results.filter((r) => r.status === "warning").length;
  const clean = results.filter((r) => r.status === "clean").length;

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
            background: "rgba(59,130,246,0.08)",
            border: "1px solid rgba(59,130,246,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
          }}
        >
          <IconReport size={44} color="rgba(59,130,246,0.5)" />
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
          보고서 생성 준비 중
        </h3>
        <p style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.7, maxWidth: 320, marginBottom: 32 }}>
          먼저 스캐너 탭에서 광고를 스캔하세요.
          <br />
          스캔 완료 후 이 탭에서 보고서를 생성할 수 있습니다.
        </p>

        {/* 단계 가이드 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            width: "100%",
            maxWidth: 320,
          }}
        >
          {[
            { step: "01", label: "스캐너 탭 열기", desc: "URL 또는 키워드 입력" },
            { step: "02", label: "광고 스캔 실행", desc: "AI가 위반 여부 자동 분석" },
            { step: "03", label: "보고서 탭으로 이동", desc: "여기서 보고서를 생성하세요" },
          ].map(({ step, label, desc }) => (
            <div
              key={step}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 16px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(59,130,246,0.2))",
                  border: "1px solid rgba(124,58,237,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#A78BFA",
                  flexShrink: 0,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {step}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#CBD5E1" }}>{label}</div>
                <div style={{ fontSize: 11, color: "#64748B" }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── 핸들러 ───────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 400)); // 생성 중 피드백
    const text = generateReportText(keyword, results);
    setReportText(text);
    setGenerating(false);
  };

  const handleCopyText = async () => {
    if (!reportText) return;
    try {
      await navigator.clipboard.writeText(reportText);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = reportText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    triggerCopy();
  };

  const handleDownloadCSV = () => {
    const csv = generateCSV(results);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `광고규정_스캔결과_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTxt = () => {
    if (!reportText) return;
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `광고규정_보고서_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── 렌더 ─────────────────────────────────────────────────────────────────
  return (
    <div className="slide-up" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── 보고서 프리뷰 카드 ── */}
      <div
        style={{
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          overflow: "hidden",
        }}
      >
        {/* 카드 헤더 */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(59,130,246,0.2))",
                border: "1px solid rgba(124,58,237,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconShield size={15} color="#A78BFA" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#E2E8F0" }}>
                스캔 결과 요약
              </div>
              <div style={{ fontSize: 11, color: "#64748B" }}>
                {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })} 기준
              </div>
            </div>
          </div>
          <div
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              background: "rgba(167,139,250,0.1)",
              border: "1px solid rgba(167,139,250,0.2)",
              fontSize: 12,
              fontWeight: 700,
              color: "#A78BFA",
            }}
          >
            총 {results.length}건
          </div>
        </div>

        {/* 도넛 차트 + 통계 */}
        <div style={{ padding: "20px 20px 14px" }}>
          <DonutRing
            violation={violations}
            warning={warnings}
            clean={clean}
            total={results.length}
          />

          {/* 비율 바 */}
          <div style={{ marginTop: 16 }}>
            <RatioBar
              violation={violations}
              warning={warnings}
              clean={clean}
              total={results.length}
            />
          </div>
        </div>

        {/* 4개 수치 요약 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {[
            { label: "총 스캔", value: results.length, color: "#A78BFA" },
            { label: "위반", value: violations, color: "#EF4444" },
            { label: "주의", value: warnings, color: "#F59E0B" },
            { label: "적법", value: clean, color: "#22C55E" },
          ].map(({ label, value, color }, i) => (
            <div
              key={label}
              style={{
                padding: "14px 12px",
                textAlign: "center",
                borderRight: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color,
                  letterSpacing: "-0.5px",
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                {value}
              </div>
              <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 액션 버튼 그룹 ── */}
      <div
        style={{
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          padding: "18px 20px",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#475569",
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          보고서 내보내기
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {/* 보고서 생성 버튼 */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "13px 16px",
              borderRadius: 11,
              border: "1px solid rgba(124,58,237,0.35)",
              background: generating
                ? "rgba(124,58,237,0.08)"
                : "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(59,130,246,0.18))",
              color: generating ? "#64748B" : "#A78BFA",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: generating ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              gridColumn: "1 / -1",
            }}
          >
            {generating ? (
              <>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    border: "2px solid rgba(124,58,237,0.3)",
                    borderTopColor: "#A78BFA",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                보고서 생성 중...
              </>
            ) : (
              <>
                <IconFileText size={15} color="#A78BFA" />
                {reportText ? "보고서 재생성" : "보고서 생성"}
              </>
            )}
          </button>

          {/* CSV 다운로드 */}
          <button
            onClick={handleDownloadCSV}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px 14px",
              borderRadius: 11,
              border: "1px solid rgba(34,197,94,0.2)",
              background: "rgba(34,197,94,0.06)",
              color: "#4ADE80",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <IconTable size={14} color="#4ADE80" />
            CSV 다운로드
          </button>

          {/* TXT 다운로드 */}
          <button
            onClick={handleDownloadTxt}
            disabled={!reportText}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px 14px",
              borderRadius: 11,
              border: reportText
                ? "1px solid rgba(6,182,212,0.2)"
                : "1px solid rgba(255,255,255,0.06)",
              background: reportText ? "rgba(6,182,212,0.06)" : "rgba(255,255,255,0.02)",
              color: reportText ? "#22D3EE" : "#334155",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: reportText ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
          >
            <IconDownload size={14} color={reportText ? "#22D3EE" : "#334155"} />
            TXT 다운로드
          </button>

          {/* 클립보드 복사 */}
          <button
            onClick={handleCopyText}
            disabled={!reportText}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px 14px",
              borderRadius: 11,
              border: copied
                ? "1px solid rgba(34,197,94,0.3)"
                : reportText
                ? "1px solid rgba(245,158,11,0.2)"
                : "1px solid rgba(255,255,255,0.06)",
              background: copied
                ? "rgba(34,197,94,0.08)"
                : reportText
                ? "rgba(245,158,11,0.06)"
                : "rgba(255,255,255,0.02)",
              color: copied ? "#4ADE80" : reportText ? "#FCD34D" : "#334155",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: reportText ? "pointer" : "not-allowed",
              transition: "all 0.25s",
            }}
          >
            {copied ? (
              <>
                <IconCheck size={14} color="#4ADE80" />
                복사 완료!
              </>
            ) : (
              <>
                <IconClipboard size={14} color={reportText ? "#FCD34D" : "#334155"} />
                클립보드 복사
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── 보고서 본문 (다크 코드 에디터 스타일) ── */}
      {reportText && (
        <div
          style={{
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(0,0,0,0.3)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            overflow: "hidden",
          }}
        >
          {/* 에디터 상단 바 */}
          <div
            style={{
              padding: "10px 16px",
              background: "rgba(255,255,255,0.03)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#EF4444", opacity: 0.8 }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#F59E0B", opacity: 0.8 }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22C55E", opacity: 0.8 }} />
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: "#475569",
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  marginLeft: 4,
                }}
              >
                report_{new Date().toISOString().slice(0, 10)}.txt
              </span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#334155",
                fontFamily: "monospace",
              }}
            >
              {reportText.split("\n").length} lines
            </div>
          </div>

          {/* 코드 영역 (라인 번호 + 본문) */}
          <div
            style={{
              display: "flex",
              maxHeight: 520,
              overflowY: "auto",
            }}
          >
            {/* 라인 번호 */}
            <div
              style={{
                padding: "14px 0",
                minWidth: 44,
                background: "rgba(0,0,0,0.25)",
                borderRight: "1px solid rgba(255,255,255,0.04)",
                userSelect: "none",
                flexShrink: 0,
              }}
            >
              {reportText.split("\n").map((_, i) => (
                <div
                  key={i}
                  style={{
                    padding: "0 12px",
                    fontSize: 11.5,
                    lineHeight: "1.72",
                    color: "#1E293B",
                    textAlign: "right",
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {/* 보고서 텍스트 */}
            <pre
              style={{
                flex: 1,
                margin: 0,
                padding: "14px 20px",
                fontSize: 12,
                lineHeight: 1.72,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                color: "#94A3B8",
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                background: "transparent",
              }}
            >
              {reportText.split("\n").map((line, i) => {
                // 헤더 라인 강조
                const isHeader = line.includes("═══") || line.includes("━━━");
                const isTitle = line.includes("변호사 광고 규정") || line.includes("위반 의심") || line.includes("주의 필요");
                const isViolation = line.includes("❌") || line.includes("위반:");
                const isWarning = line.includes("⚠️") && !line.includes("본 보고서");
                const isClean = line.includes("✅");
                const isInfo = line.startsWith("📅") || line.startsWith("🔑") || line.startsWith("📊");

                return (
                  <span
                    key={i}
                    style={{
                      display: "block",
                      color: isHeader
                        ? "#334155"
                        : isTitle
                        ? "#C4B5FD"
                        : isViolation
                        ? "#F87171"
                        : isWarning
                        ? "#FCD34D"
                        : isClean
                        ? "#4ADE80"
                        : isInfo
                        ? "#7DD3FC"
                        : "#94A3B8",
                      fontWeight: isTitle ? 700 : 400,
                    }}
                  >
                    {line || "\u00A0"}
                  </span>
                );
              })}
            </pre>
          </div>
        </div>
      )}

      {/* ── Pro 기능 티저 배너 ── */}
      <div
        style={{
          borderRadius: 14,
          border: "1px solid rgba(245,158,11,0.2)",
          background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(251,191,36,0.03))",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(245,158,11,0.12)",
              border: "1px solid rgba(245,158,11,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconStar size={16} color="#F59E0B" />
          </div>
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#FCD34D",
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 2,
              }}
            >
              Pro 기능
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: "rgba(245,158,11,0.2)",
                  border: "1px solid rgba(245,158,11,0.3)",
                  color: "#F59E0B",
                  fontWeight: 800,
                  letterSpacing: "0.5px",
                }}
              >
                SOON
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#94A3B8" }}>
              PDF 보고서, 자동 스케줄 스캔, 이메일 알림, 팀 공유
            </div>
          </div>
        </div>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "8px 14px",
            borderRadius: 9,
            border: "1px solid rgba(245,158,11,0.3)",
            background: "rgba(245,158,11,0.1)",
            color: "#F59E0B",
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "inherit",
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.2s",
          }}
        >
          <IconZap size={12} color="#F59E0B" />
          업그레이드
        </button>
      </div>

      {/* ── 면책 고지 ── */}
      <div
        style={{
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(255,255,255,0.02)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <div style={{ flexShrink: 0, marginTop: 1 }}>
          <IconShield size={13} color="#475569" />
        </div>
        <p style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.6, margin: 0 }}>
          본 보고서는 AI 기반 참고용 분석입니다. 법적 효력이 없으며 최종 판단은
          반드시 법률 전문가에게 확인하시기 바랍니다. 대한변호사협회 광고규정
          (2025.2.6. 개정) 기반으로 분석됩니다.
        </p>
      </div>
    </div>
  );
};

export default ReportPanel;
