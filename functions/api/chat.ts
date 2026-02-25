/**
 * Cloudflare Pages Function: /api/chat
 *
 * 역할: 클라이언트에서 Anthropic API 키를 노출하지 않고
 *       서버사이드에서 안전하게 Claude API를 호출하는 프록시
 *
 * 환경변수 설정:
 *   Cloudflare Dashboard > Pages > Settings > Environment variables
 *   ANTHROPIC_API_KEY = "sk-ant-api03-..."
 */

interface Env {
  ANTHROPIC_API_KEY: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  system: string;
}

interface AnthropicContentBlock {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content: AnthropicContentBlock[];
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

const MAX_MESSAGE_LENGTH = 5000;
const MAX_MESSAGES_COUNT = 50;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

/** OPTIONS 프리플라이트 요청 처리 */
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { ANTHROPIC_API_KEY } = context.env;

  // 1) API 키 확인
  if (!ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  // 2) 요청 본문 파싱
  let body: ChatRequest;
  try {
    body = await context.request.json();
  } catch {
    return Response.json(
      { error: "잘못된 요청 형식입니다." },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const { messages, system } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return Response.json(
      { error: "messages 배열이 필요합니다." },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // 3) 입력 검증
  if (messages.length > MAX_MESSAGES_COUNT) {
    return Response.json(
      { error: `메시지는 최대 ${MAX_MESSAGES_COUNT}개까지 허용됩니다.` },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  for (const msg of messages) {
    if (typeof msg.content !== "string" || msg.content.length > MAX_MESSAGE_LENGTH) {
      return Response.json(
        { error: `각 메시지는 최대 ${MAX_MESSAGE_LENGTH}자까지 허용됩니다.` },
        { status: 400, headers: CORS_HEADERS }
      );
    }
  }

  // 4) Anthropic API 호출
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: system || "",
        messages: messages,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("Anthropic API Error:", anthropicRes.status, errText);
      return Response.json(
        { error: `AI 서비스 오류 (${anthropicRes.status})` },
        { status: anthropicRes.status, headers: CORS_HEADERS }
      );
    }

    const data: AnthropicResponse = await anthropicRes.json();

    // 5) 텍스트 응답 추출
    const textContent = data.content
      ?.filter((block) => block.type === "text")
      ?.map((block) => block.text)
      ?.join("") || "";

    return Response.json(
      {
        content: textContent,
        usage: data.usage,
      },
      {
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    if (message === "The operation was aborted") {
      console.error("Function Error: Request timeout");
      return Response.json(
        { error: "AI 응답 시간이 초과되었습니다. 다시 시도해주세요." },
        { status: 504, headers: CORS_HEADERS }
      );
    }
    console.error("Function Error:", message);
    return Response.json(
      { error: "서버 내부 오류가 발생했습니다." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
};
