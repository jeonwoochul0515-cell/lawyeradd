/**
 * /api/auto-scan - 여러 키워드로 네이버 검색 후 URL 중복 제거하여 반환
 *
 * POST { keywords: string[], maxResultsPerKeyword?: number }
 * → { success: true, data: { totalFound, keywords, items[] } }
 */

interface Env {
  NAVER_CLIENT_ID?: string;
  NAVER_CLIENT_SECRET?: string;
}

interface NaverItem {
  title: string;
  link: string;
  description: string;
}

interface NaverResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverItem[];
}

interface AutoScanItem {
  title: string;
  link: string;
  description: string;
  keyword: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { keywords, maxResultsPerKeyword = 10 } = (await context.request.json()) as {
      keywords: string[];
      maxResultsPerKeyword?: number;
    };

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return Response.json(
        { success: false, error: "검색 키워드 배열이 필요합니다." },
        { status: 400 }
      );
    }

    // 최대 20개 키워드
    const limitedKeywords = keywords.slice(0, 20);
    const maxPerKw = Math.min(maxResultsPerKeyword, 30);

    const { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET } = context.env;

    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
      return Response.json({
        success: false,
        error:
          "네이버 API 키가 설정되지 않았습니다. " +
          "Cloudflare 환경변수에 NAVER_CLIENT_ID, NAVER_CLIENT_SECRET을 설정하세요.",
      }, { status: 500 });
    }

    const allItems: AutoScanItem[] = [];
    const seenUrls = new Set<string>();

    for (let i = 0; i < limitedKeywords.length; i++) {
      const kw = limitedKeywords[i];
      const query = encodeURIComponent(kw + " 변호사");
      const naverUrl = `https://openapi.naver.com/v1/search/blog.json?query=${query}&display=${maxPerKw}&sort=date`;

      try {
        const naverRes = await fetch(naverUrl, {
          headers: {
            "X-Naver-Client-Id": NAVER_CLIENT_ID,
            "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
          },
        });

        if (naverRes.ok) {
          const data: NaverResponse = await naverRes.json();
          for (const item of data.items) {
            const normalizedUrl = item.link.replace(/\/$/, "");
            if (!seenUrls.has(normalizedUrl)) {
              seenUrls.add(normalizedUrl);
              allItems.push({
                title: item.title.replace(/<[^>]+>/g, ""),
                link: item.link,
                description: item.description.replace(/<[^>]+>/g, ""),
                keyword: kw,
              });
            }
          }
        }
      } catch (err) {
        console.error(`키워드 "${kw}" 검색 실패:`, err);
      }

      // 키워드별 100ms 딜레이 (네이버 rate limit 대응)
      if (i < limitedKeywords.length - 1) {
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    return Response.json({
      success: true,
      data: {
        totalFound: allItems.length,
        keywords: limitedKeywords,
        items: allItems,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return Response.json(
      { success: false, error: "자동 스캔 검색 오류: " + message },
      { status: 500 }
    );
  }
};
