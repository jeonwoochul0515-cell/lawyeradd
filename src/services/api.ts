import type { ScanResult, SearchItem } from "../types";

/** 단일 URL 스캔 (크롤링 + 분석 원스톱) */
export async function scanUrl(url: string): Promise<ScanResult> {
  const res = await fetch("/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  const data: { success: boolean; data?: ScanResult; error?: string } = await res.json();
  if (!data.success) throw new Error(data.error || "스캔 실패");
  return data.data!;
}

/** 키워드로 검색 (네이버 블로그) */
export async function searchKeyword(
  keyword: string,
  maxResults = 10
): Promise<SearchItem[]> {
  const res = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword, maxResults }),
  });

  const data: { success: boolean; data?: SearchItem[]; error?: string } = await res.json();
  if (!data.success) throw new Error(data.error || "검색 실패");
  return data.data || [];
}

/** 보고서 텍스트 생성 (클라이언트 사이드) */
export function generateReportText(
  keyword: string,
  results: ScanResult[]
): string {
  const now = new Date().toLocaleString("ko-KR");
  const violations = results.filter((r) => r.status === "violation");
  const warnings = results.filter((r) => r.status === "warning");
  const clean = results.filter((r) => r.status === "clean");

  let report = "";
  report += "═══════════════════════════════════════\n";
  report += "  변호사 광고 규정 위반 모니터링 보고서\n";
  report += "═══════════════════════════════════════\n\n";
  report += `📅 생성일시: ${now}\n`;
  report += `🔑 검색 키워드: ${keyword || "직접 입력"}\n`;
  report += `📊 총 스캔: ${results.length}건\n`;
  report += `   ❌ 위반: ${violations.length}건\n`;
  report += `   ⚠️ 주의: ${warnings.length}건\n`;
  report += `   ✅ 적법: ${clean.length}건\n\n`;

  if (violations.length > 0) {
    report += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    report += "❌ 위반 의심 광고 목록\n";
    report += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    violations.forEach((r, i) => {
      report += `[${i + 1}] ${r.title}\n`;
      report += `    🔗 ${r.url}\n`;
      report += `    📅 스캔일시: ${new Date(r.scannedAt).toLocaleString("ko-KR")}\n`;
      r.violations.forEach((v) => {
        report += `    ⚖️ ${v.article}: "${v.keyword}" → ${v.description}\n`;
      });
      report += "\n";
    });
  }

  if (warnings.length > 0) {
    report += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    report += "⚠️ 주의 필요 광고 목록\n";
    report += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    warnings.forEach((r, i) => {
      report += `[${i + 1}] ${r.title}\n`;
      report += `    🔗 ${r.url}\n`;
      r.violations.forEach((v) => {
        report += `    ⚖️ ${v.article}: "${v.keyword}" → ${v.description}\n`;
      });
      report += "\n";
    });
  }

  report += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  report += "⚠️ 본 보고서는 AI 기반 참고용 분석입니다.\n";
  report += "   최종 판단은 변호사에게 확인하시기 바랍니다.\n";
  report += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

  return report;
}

/** CSV 내보내기 */
export function generateCSV(results: ScanResult[]): string {
  const header = "상태,제목,URL,위반조항,탐지문구,설명,스캔일시\n";
  const rows = results.flatMap((r) => {
    if (r.violations.length === 0) {
      return [
        `${r.status},${csvEscape(r.title)},${r.url},없음,없음,위반 사항 없음,${r.scannedAt}`,
      ];
    }
    return r.violations.map(
      (v) =>
        `${r.status},${csvEscape(r.title)},${r.url},${v.article},${csvEscape(v.keyword)},${csvEscape(v.description)},${r.scannedAt}`
    );
  });

  return "\uFEFF" + header + rows.join("\n"); // BOM for Korean Excel
}

function csvEscape(str: string): string {
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}
