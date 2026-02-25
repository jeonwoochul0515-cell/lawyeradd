/**
 * /api/crawl - URL에서 텍스트 추출
 *
 * POST { url: string }
 * → { success: true, data: { title, text, url } }
 */

interface Env {
  ANTHROPIC_API_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { url } = (await context.request.json()) as { url: string };

    if (!url) {
      return Response.json({ success: false, error: "URL이 필요합니다." }, { status: 400 });
    }

    // 페이지 가져오기
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LegalAdMonitor/1.0; +https://example.com)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      return Response.json(
        { success: false, error: `페이지 로드 실패 (${res.status})` },
        { status: 400 }
      );
    }

    const html = await res.text();

    // HTML에서 텍스트 추출 (간단한 태그 제거)
    const title = extractTitle(html);
    const text = extractText(html);

    return Response.json({
      success: true,
      data: {
        title: title || "제목 없음",
        text: text.slice(0, 8000), // 최대 8000자
        url,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return Response.json(
      { success: false, error: "크롤링 오류: " + message },
      { status: 500 }
    );
  }
};

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].replace(/[\n\r\t]/g, "").trim() : "";
}

function extractText(html: string): string {
  // script, style, nav, header, footer 제거
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  // 모든 태그 제거
  cleaned = cleaned.replace(/<[^>]+>/g, " ");

  // HTML 엔티티 디코딩
  cleaned = cleaned
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // 공백 정리
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}
