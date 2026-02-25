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

    // 네이버 블로그는 모바일 URL로 변환 (JS 렌더링 없이 본문 접근 가능)
    const fetchUrl = toMobileUrl(url);

    // 페이지 가져오기
    const res = await fetch(fetchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
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

    // HTML에서 텍스트 추출 (플랫폼별 최적화)
    const title = extractTitle(html);
    const text = extractText(html, fetchUrl);

    if (text.length < 50) {
      return Response.json({
        success: true,
        data: {
          title: title || "제목 없음",
          text: `[크롤링 제한] 본문 추출 실패 (${text.length}자). 원본 URL: ${url}`,
          url,
        },
      });
    }

    return Response.json({
      success: true,
      data: {
        title: title || "제목 없음",
        text: text.slice(0, 8000),
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

// ── 네이버 블로그 → 모바일 URL 변환 ──
function toMobileUrl(url: string): string {
  // blog.naver.com/username/postId → m.blog.naver.com/username/postId
  if (url.includes("blog.naver.com") && !url.includes("m.blog.naver.com")) {
    return url.replace("blog.naver.com", "m.blog.naver.com");
  }
  // PostView.naver 형식도 모바일로
  if (url.includes("blog.naver.com/PostView.naver")) {
    return url.replace("blog.naver.com", "m.blog.naver.com");
  }
  return url;
}

function extractTitle(html: string): string {
  // 네이버 블로그 제목 우선 추출
  const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"[^>]*>/i);
  if (ogTitle) return decodeHtmlEntities(ogTitle[1].trim());

  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtmlEntities(match[1].replace(/[\n\r\t]/g, "").trim()) : "";
}

function extractText(html: string, url: string): string {
  // 네이버 블로그 전용 추출
  if (url.includes("blog.naver.com") || url.includes("m.blog.naver.com")) {
    return extractNaverBlog(html);
  }
  // 티스토리
  if (url.includes("tistory.com")) {
    return extractBySelector(html, [
      /<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*tt_article_useless_p_margin[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    ]);
  }
  // 일반 페이지: article > main > body 순서
  return extractGeneric(html);
}

function extractNaverBlog(html: string): string {
  // 모바일 네이버 블로그 본문 영역 추출 시도
  const contentPatterns = [
    // 모바일 블로그 본문
    /<div[^>]*class="[^"]*se-main-container[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/i,
    /<div[^>]*class="[^"]*post_ct[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*se_component_wrap[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // 구 에디터
    /<div[^>]*id="postViewArea"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*id="post-view[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // 모바일 본문 컨테이너
    /<div[^>]*class="[^"]*sect_dsc[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*_postView[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const pattern of contentPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const text = stripHtmlTags(match[1]);
      if (text.length > 100) return text;
    }
  }

  // 패턴 매칭 실패 시 og:description 사용
  const ogDesc = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"[^>]*>/i);
  const metaDesc = html.match(/<meta\s+name="description"\s+content="([^"]*)"[^>]*>/i);
  const descText = ogDesc ? ogDesc[1] : metaDesc ? metaDesc[1] : "";

  // 전체 body에서 추출 (폴백)
  const bodyText = extractGeneric(html);
  if (bodyText.length > 200) return bodyText;

  // description이라도 반환
  return decodeHtmlEntities(descText);
}

function extractBySelector(html: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const text = stripHtmlTags(match[1]);
      if (text.length > 100) return text;
    }
  }
  return extractGeneric(html);
}

function extractGeneric(html: string): string {
  // article 태그 우선
  const article = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (article) {
    const text = stripHtmlTags(article[1]);
    if (text.length > 100) return text;
  }

  // main 태그
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (main) {
    const text = stripHtmlTags(main[1]);
    if (text.length > 100) return text;
  }

  // body 전체 (마지막 수단)
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return body ? stripHtmlTags(body[1]) : stripHtmlTags(html);
}

function stripHtmlTags(html: string): string {
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
  cleaned = decodeHtmlEntities(cleaned);

  // 공백 정리
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}
