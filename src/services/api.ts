import type { ChatMessage, APIResponse } from "../types";
import { SYSTEM_PROMPT } from "../data/regulations";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Cloudflare Pages Function을 통해 Claude API를 호출합니다.
 * API 키는 서버사이드(Cloudflare 환경변수)에서 관리되므로 안전합니다.
 * 실패 시 자동으로 최대 2회 재시도합니다.
 */
export async function sendChat(messages: ChatMessage[]): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        await wait(RETRY_DELAY_MS * attempt);
      }

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
          const errData: { error?: string } = await res.json();
          if (errData.error) errorMsg = errData.error;
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
        }

        if (isRetryableStatus(res.status) && attempt < MAX_RETRIES) {
          lastError = new Error(errorMsg);
          continue;
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
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      lastError = error;

      if (attempt < MAX_RETRIES && error.name !== "AbortError") {
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new Error("알 수 없는 오류가 발생했습니다.");
}
