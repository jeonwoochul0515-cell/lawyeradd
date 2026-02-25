/** 탭 메뉴 설정 */
export const TABS = [
  { id: "scanner" as const, label: "🔍 스캐너", desc: "URL 또는 키워드로 스캔" },
  { id: "results" as const, label: "📊 결과", desc: "스캔 결과 목록" },
  { id: "report" as const, label: "📋 보고서", desc: "종합 보고서 생성" },
] as const;

/** 상태 배지 설정 */
export const STATUS_CONFIG = {
  clean: { emoji: "✅", label: "적법", color: "#22C55E", bg: "#F0FDF4" },
  warning: { emoji: "⚠️", label: "주의", color: "#EAB308", bg: "#FEFCE8" },
  violation: { emoji: "❌", label: "위반", color: "#EF4444", bg: "#FEF2F2" },
} as const;

/** 예시 URL */
export const EXAMPLE_URLS = [
  "https://blog.naver.com/example-lawyer-blog",
];

/** 예시 검색 키워드 */
export const EXAMPLE_KEYWORDS = [
  "이혼변호사 부산",
  "형사전문 변호사",
  "교통사고 변호사 무료상담",
  "성범죄 전문 변호사",
];
