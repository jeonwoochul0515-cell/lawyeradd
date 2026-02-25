/** 스캔 결과 한 건 */
export interface ScanResult {
  id: string;
  url: string;
  title: string;
  source: string;            // "naver_blog" | "website" | "manual"
  scannedAt: string;         // ISO date
  status: "clean" | "warning" | "violation";
  violations: Violation[];
  rawText: string;           // 크롤링된 원문 (앞부분 요약)
  analysisText: string;      // AI 삼단논법 분석 전문
}

/** 위반 사항 한 건 */
export interface Violation {
  article: string;           // 예: "제4조 제1호"
  type: "violation" | "warning";
  keyword: string;           // 탐지된 문구
  description: string;       // 위반 설명
}

/** 검색 요청 */
export interface SearchRequest {
  keyword: string;
  maxResults?: number;
}

/** 검색 결과 (네이버 API 등) */
export interface SearchItem {
  title: string;
  link: string;
  description: string;
}

/** 단일 URL 분석 요청 */
export interface AnalyzeRequest {
  url: string;
}

/** 배치 스캔 요청 */
export interface BatchScanRequest {
  keyword: string;
  maxPages?: number;
}

/** API 응답 래퍼 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/** 보고서 데이터 */
export interface ReportData {
  generatedAt: string;
  keyword: string;
  totalScanned: number;
  violationCount: number;
  warningCount: number;
  cleanCount: number;
  results: ScanResult[];
}

/** 자동 스캔 검색 아이템 (SearchItem + keyword) */
export interface AutoScanItem extends SearchItem {
  keyword: string;
}

/** 자동 스캔 Discovery 결과 */
export interface AutoScanDiscoveryResult {
  totalFound: number;
  keywords: string[];
  items: AutoScanItem[];
}

/** 앱 탭 */
export type TabId = "scanner" | "results" | "report";
