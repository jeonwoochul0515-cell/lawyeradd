import type { ChatMessage, APIResponse } from "../types";
import { SYSTEM_PROMPT } from "../data/regulations";

/**
 * Cloudflare Pages Function을 통해 Claude API를 호출합니다.
 * API 키는 서버사이드(Cloudflare 환경변수)에서 관리되므로 안전합니다.
 */
export async function sendChat(messages: ChatMessage[]): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      system: SYSTEM_PROMPT,
    }),
  });

  if (!res.ok) {
    let errorMsg = `서버 오류 (${res.status})`;
    try {
      const errData = await res.json();
      if (errData.error) errorMsg = errData.error;
    } catch {
      // JSON 파싱 실패 시 기본 메시지 사용
    }
    throw new Error(errorMsg);
  }

  const data: APIResponse = await res.json();

  if (data.error) {
    throw new Error(data.error);
  }

  if (!data.content) {
    throw new Error("빈 응답이 반환되었습니다.");
  }

  return data.content;
}
