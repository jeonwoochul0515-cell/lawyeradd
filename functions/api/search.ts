/**
 * /api/search - 네이버 검색 API를 통해 변호사 광고 페이지 검색
 *
 * POST { keyword: string, maxResults?: number }
 * → { success: true, data: SearchItem[] }
 *
 * 네이버 API 키가 없으면 대체 방식으로 동작
 */

interface Env {
  NAVER_CLIENT_ID?: string;
  NAVER_CLIENT_SECRET?: string;
}

interface NaverItem {
  title: string;
  link: string;
  description: string;
  bloggername?: string;
  bloggerlink?: string;
  postdate?: string;
}

interface NaverResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverItem[];
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { keyword, maxResults = 10 } = (await context.request.json()) as {
      keyword: string;
      maxResults?: number;
    };

    if (!keyword) {
      return Response.json(
        { success: false, error: "검색 키워드가 필요합니다." },
        { status: 400 }
      );
    }

    const { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET } = context.env;

    // 네이버 API 키가 있으면 블로그 검색
    if (NAVER_CLIENT_ID && NAVER_CLIENT_SECRET) {
      const query = encodeURIComponent(keyword + " 변호사");
      const naverUrl = `https://openapi.naver.com/v1/search/blog.json?query=${query}&display=${maxResults}&sort=date`;

      const naverRes = await fetch(naverUrl, {
        headers: {
          "X-Naver-Client-Id": NAVER_CLIENT_ID,
          "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
        },
      });

      if (naverRes.ok) {
        const data: NaverResponse = await naverRes.json();
        const items = data.items.map((item) => ({
          title: item.title.replace(/<[^>]+>/g, ""),
          link: item.link,
          description: item.description.replace(/<[^>]+>/g, ""),
        }));

        return Response.json({ success: true, data: items });
      }
    }

    // 네이버 API가 없으면 빈 결과 + 안내 메시지
    return Response.json({
      success: true,
      data: [],
      message:
        "네이버 API 키가 설정되지 않았습니다. " +
        "Cloudflare 환경변수에 NAVER_CLIENT_ID, NAVER_CLIENT_SECRET을 설정하세요. " +
        "또는 URL 직접 입력 모드를 사용하세요.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return Response.json(
      { success: false, error: "검색 오류: " + message },
      { status: 500 }
    );
  }
};
