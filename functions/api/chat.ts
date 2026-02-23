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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { ANTHROPIC_API_KEY } = context.env;

  // 1) API 키 확인
  if (!ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  // 2) 요청 본문 파싱
  let body: ChatRequest;
  try {
    body = await context.request.json();
  } catch {
    return Response.json(
      { error: "잘못된 요청 형식입니다." },
      { status: 400 }
    );
  }

  const { messages, system } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return Response.json(
      { error: "messages 배열이 필요합니다." },
      { status: 400 }
    );
  }

  // 3) Anthropic API 호출
  try {
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
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("Anthropic API Error:", anthropicRes.status, errText);
      return Response.json(
        { error: `AI 서비스 오류 (${anthropicRes.status})` },
        { status: anthropicRes.status }
      );
    }

    const data = await anthropicRes.json();

    // 4) 텍스트 응답 추출
    const textContent = (data as any).content
      ?.filter((block: any) => block.type === "text")
      ?.map((block: any) => block.text)
      ?.join("") || "";

    return Response.json(
      {
        content: textContent,
        usage: (data as any).usage,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err: any) {
    console.error("Function Error:", err);
    return Response.json(
      { error: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
};
