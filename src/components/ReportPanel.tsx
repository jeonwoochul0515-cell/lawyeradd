import React, { useState } from "react";
import type { ScanResult } from "../types";
import { generateReportText, generateCSV } from "../services/api";

interface Props {
  results: ScanResult[];
  keyword: string;
}

const ReportPanel: React.FC<Props> = ({ results, keyword }) => {
  const [reportText, setReportText] = useState("");

  if (results.length === 0) {
    return (
      <div className="slide-up" style={{ textAlign: "center", padding: "60px 20px", color: "var(--c-muted)" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <p style={{ fontSize: 15, fontWeight: 600 }}>보고서를 생성하려면 먼저 스캔을 진행하세요</p>
        <p style={{ fontSize: 13, marginTop: 6 }}>스캐너 탭에서 광고를 스캔하면 여기서 보고서를 만들 수 있습니다</p>
      </div>
    );
  }

  const handleGenerate = () => {
    const text = generateReportText(keyword, results);
    setReportText(text);
  };

  const handleCopyText = async () => {
    if (!reportText) return;
    try {
      await navigator.clipboard.writeText(reportText);
      alert("보고서가 클립보드에 복사되었습니다.");
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = reportText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      alert("보고서가 클립보드에 복사되었습니다.");
    }
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

  const violations = results.filter((r) => r.status === "violation").length;
  const warnings = results.filter((r) => r.status === "warning").length;

  const s = {
    card: {
      background: "var(--c-surface)", borderRadius: 14, border: "1px solid var(--c-border)",
      padding: 20, marginBottom: 16,
    } as React.CSSProperties,
    btn: {
      padding: "10px 18px", borderRadius: 10, border: "none", fontSize: 13,
      fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
      transition: "all .2s",
    } as React.CSSProperties,
  };

  return (
    <div className="slide-up">
      {/* 요약 카드 */}
      <div style={s.card}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>📋 보고서 생성</h3>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16,
        }}>
          <div style={{ textAlign: "center", padding: 12, background: "#F8F5F0", borderRadius: 10 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--c-accent)" }}>{results.length}</div>
            <div style={{ fontSize: 12, color: "var(--c-muted)" }}>총 스캔</div>
          </div>
          <div style={{ textAlign: "center", padding: 12, background: "#FEF2F2", borderRadius: 10 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--c-red)" }}>{violations}</div>
            <div style={{ fontSize: 12, color: "var(--c-muted)" }}>위반</div>
          </div>
          <div style={{ textAlign: "center", padding: 12, background: "#FEFCE8", borderRadius: 10 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--c-yellow)" }}>{warnings}</div>
            <div style={{ fontSize: 12, color: "var(--c-muted)" }}>주의</div>
          </div>
        </div>

        {/* 버튼들 */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={handleGenerate} style={{ ...s.btn, background: "var(--c-primary-l)", color: "#FFF" }}>
            📝 보고서 생성
          </button>
          <button onClick={handleDownloadCSV} style={{ ...s.btn, background: "#F0FDF4", color: "#166534", border: "1px solid #BBF7D0" }}>
            📊 CSV 다운로드
          </button>
          {reportText && (
            <>
              <button onClick={handleCopyText} style={{ ...s.btn, background: "#EFF6FF", color: "#1E40AF", border: "1px solid #BFDBFE" }}>
                📋 복사
              </button>
              <button onClick={handleDownloadTxt} style={{ ...s.btn, background: "#FFF7ED", color: "#9A3412", border: "1px solid #FED7AA" }}>
                💾 TXT 다운로드
              </button>
            </>
          )}
        </div>
      </div>

      {/* 보고서 본문 */}
      {reportText && (
        <div style={s.card}>
          <pre style={{
            fontSize: 12.5, lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word",
            color: "var(--c-text)", fontFamily: "var(--font)", maxHeight: 500, overflowY: "auto",
          }}>
            {reportText}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ReportPanel;
