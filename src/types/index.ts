/** 채팅 메시지 타입 */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** API 응답 타입 */
export interface APIResponse {
  content: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  error?: string;
}

/** 앱 상태 */
export type AppStatus = "idle" | "loading" | "error";
