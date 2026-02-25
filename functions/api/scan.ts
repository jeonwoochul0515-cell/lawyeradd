/**
 * /api/scan - URL 하나를 크롤링 + 분석 원스톱 처리
 *
 * POST { url: string }
 * → { success: true, data: ScanResult }
 */

interface Env {
  ANTHROPIC_API_KEY: string;
}

interface CrawlData {
  title: string;
  text: string;
  url: string;
}

interface AnalyzeData {
  status: string;
  violations: Array<{
    article: string;
    type: string;
    keyword: string;
    description: string;
  }>;
  analysisText: string;
  suspectKeywords: string[];
  apiCalled: boolean;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { url } = (await context.request.json()) as { url: string };

    if (!url) {
      return Response.json(
        { success: false, error: "URL이 필요합니다." },
        { status: 400 }
      );
    }

    const baseUrl = new URL(context.request.url).origin;

    // Step 1: 크롤링
    const crawlRes = await fetch(`${baseUrl}/api/crawl`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const crawlData: { success: boolean; data?: CrawlData; error?: string } = await crawlRes.json();
    if (!crawlData.success) {
      return Response.json({
        success: false,
        error: crawlData.error || "크롤링 실패",
      });
    }

    const { title, text } = crawlData.data!;

    // Step 2: 분석
    const analyzeRes = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, url, title }),
    });

    const analyzeData: { success: boolean; data?: AnalyzeData; error?: string } = await analyzeRes.json();
    if (!analyzeData.success) {
      return Response.json({
        success: false,
        error: analyzeData.error || "분석 실패",
      });
    }

    const result = {
      id: crypto.randomUUID(),
      url,
      title,
      source: detectSource(url),
      scannedAt: new Date().toISOString(),
      status: analyzeData.data!.status,
      violations: analyzeData.data!.violations,
      rawText: text.slice(0, 500),
      analysisText: analyzeData.data!.analysisText,
      suspectKeywords: analyzeData.data!.suspectKeywords,
      apiCalled: analyzeData.data!.apiCalled,
    };

    return Response.json({ success: true, data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return Response.json(
      { success: false, error: "스캔 오류: " + message },
      { status: 500 }
    );
  }
};

function detectSource(url: string): string {
  if (url.includes("blog.naver.com")) return "naver_blog";
  if (url.includes("tistory.com")) return "tistory";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("brunch.co.kr")) return "brunch";
  return "website";
}
