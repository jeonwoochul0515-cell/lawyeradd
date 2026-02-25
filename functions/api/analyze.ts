/**
 * /api/analyze - 크롤링된 텍스트를 AI로 분석하여 위반 사항 탐지
 *
 * POST { text: string, url: string, title: string }
 * → { success: true, data: { status, violations[], analysisText } }
 */

interface Env {
  ANTHROPIC_API_KEY: string;
}

interface AnthropicContentBlock {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content: AnthropicContentBlock[];
}

interface ViolationItem {
  article: string;
  type: "violation" | "warning";
  keyword: string;
  description: string;
}

interface AnalysisResult {
  status: "clean" | "warning" | "violation";
  violations: ViolationItem[];
  summary?: string;
}

// ── 1차 필터: 키워드 기반 사전 검사 (API 비용 절감) ──
const SUSPECT_KEYWORDS = [
  // 제4조 제1호: 허위·과장
  "승소율", "100%", "성공률", "전승", "무패", "승소 보장",
  // 제4조 제10호: 보수액 관련
  "최저가", "할인", "쿠폰", "후불", "환불", "분할납부", "착수금 없", "수익금",
  "견적", "입찰", "비교견적",
  // 제4조 제11호: 무료·염가
  "무료 상담", "무료상담", "0원", "공짜",
  // 제4조 제12호: 결과 예측
  "무죄 보장", "승소 확신", "반드시", "100% 해결", "확실한 결과",
  "불기소 보장", "집행유예 보장",
  // 제7조: 전관
  "전관", "전관예우", "전관 변호사", "전직 판사", "전직 검사",
  // 제9조 제2항: 최고·유일
  "최고", "유일", "최초", "넘버원", "No.1", "1위",
  // 제5조: 광고방법
  "긴급", "지금 전화", "한정 상담",
];

function preFilter(text: string): string[] {
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const kw of SUSPECT_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      found.push(kw);
    }
  }
  return found;
}

// ── 분석 시스템 프롬프트 ──
const ANALYSIS_SYSTEM = `당신은 변호사 광고 규정 위반 탐지 AI입니다.

[변호사 광고에 관한 규정 - 핵심 조항]
제4조: 허위·과장(1호), 오해유발(2호), 비방·비교(3호), 품위훼손(4호), 무단접촉(5호), 가짜자격(6호), 사건·의뢰인 표시(7호), 공무원 관계 암시(8호), 보수액 수임질서 저해(10호), 무료·염가(11호), 결과예측(12호), "최고"/"유일" 금지(제9조2항)
제5조: 불특정다수 메시지, 전단살포, 운송수단 광고, 현수막 등 금지
제6조: AI 이용 광고 시 협회 등록 + 검토변호사 표시 필수
제7조: 전관 강조, 전관예우 문구, 공직 영향력 암시 금지
제10조: 무료/염가 법률상담 광고 금지(공익 목적 예외)

## 분석 지시

주어진 광고 텍스트에서 위반 의심 문구를 모두 찾아 다음 JSON 형식으로 응답하세요.
반드시 아래 JSON만 출력하세요. 설명이나 마크다운은 붙이지 마세요.

{
  "status": "clean" | "warning" | "violation",
  "violations": [
    {
      "article": "제X조 제X호",
      "type": "violation" | "warning",
      "keyword": "탐지된 문구",
      "description": "위반 이유 (한 줄)"
    }
  ],
  "summary": "삼단논법 요약 (대전제→소전제→결론 형식, 200자 이내)"
}

- violation: 명백한 규정 위반
- warning: 위반 가능성이 있어 주의 필요
- clean: 위반 사항 없음
- violations 배열이 비어있으면 status는 반드시 "clean"
- 하나라도 violation이면 status는 "violation", warning만 있으면 "warning"`;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { ANTHROPIC_API_KEY } = context.env;

  if (!ANTHROPIC_API_KEY) {
    return Response.json(
      { success: false, error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  try {
    const { text, url, title } = (await context.request.json()) as {
      text: string;
      url: string;
      title: string;
    };

    if (!text) {
      return Response.json(
        { success: false, error: "분석할 텍스트가 필요합니다." },
        { status: 400 }
      );
    }

    // 1차 키워드 필터
    const suspectKeywords = preFilter(text);

    // 의심 키워드가 없으면 clean 처리 (API 비용 절감!)
    if (suspectKeywords.length === 0) {
      return Response.json({
        success: true,
        data: {
          status: "clean",
          violations: [],
          analysisText:
            "📜 [대전제] 변호사 광고에 관한 규정은 허위·과장·결과예측 등을 금지합니다.\n" +
            "📌 [소전제] 이 광고에서는 규정 위반이 의심되는 키워드가 발견되지 않았습니다.\n" +
            "⚖️ [결론] ✅ 1차 키워드 검사 통과. 명백한 위반 징후 없음.",
          suspectKeywords: [],
          apiCalled: false,
        },
      });
    }

    // 2차 AI 정밀 분석
    const truncatedText = text.slice(0, 3000);
    const userMessage = `다음 변호사 광고 텍스트를 분석하세요.

[URL] ${url}
[제목] ${title}
[1차 필터 의심 키워드] ${suspectKeywords.join(", ")}

[광고 텍스트]
${truncatedText}`;

    // 429 재시도 로직 (exponential backoff, 최대 2회)
    let anthropicRes: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: ANALYSIS_SYSTEM,
          messages: [{ role: "user", content: userMessage }],
        }),
      });

      if (anthropicRes.status !== 429 || attempt >= 2) break;
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s
      await new Promise((r) => setTimeout(r, delay));
    }

    if (!anthropicRes || !anthropicRes.ok) {
      const errText = anthropicRes ? await anthropicRes.text() : "No response";
      console.error("Anthropic API Error:", anthropicRes?.status, errText);
      return Response.json(
        { success: false, error: `AI 분석 오류 (${anthropicRes?.status})` },
        { status: 500 }
      );
    }

    const aiData: AnthropicResponse = await anthropicRes.json();
    const aiText =
      aiData.content
        ?.filter((b) => b.type === "text")
        ?.map((b) => b.text)
        ?.join("") || "";

    // JSON 파싱 시도
    let analysis: AnalysisResult;
    try {
      // ```json ... ``` 감싸기 제거
      const jsonStr = aiText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      analysis = JSON.parse(jsonStr);
    } catch {
      // JSON 파싱 실패 시 기본 구조
      analysis = {
        status: "warning",
        violations: suspectKeywords.map((kw) => ({
          article: "확인 필요",
          type: "warning" as const,
          keyword: kw,
          description: "AI 분석 결과를 파싱하지 못했습니다. 수동 확인이 필요합니다.",
        })),
        summary: aiText.slice(0, 300),
      };
    }

    // 삼단논법 형식 보고서 생성
    const analysisReport = generateSyllogismReport(analysis, url, title);

    return Response.json({
      success: true,
      data: {
        status: analysis.status,
        violations: analysis.violations || [],
        analysisText: analysisReport,
        suspectKeywords,
        apiCalled: true,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return Response.json(
      { success: false, error: "분석 오류: " + message },
      { status: 500 }
    );
  }
};

function generateSyllogismReport(
  analysis: AnalysisResult,
  url: string,
  title: string
): string {
  let report = `🔍 판단: ${
    analysis.status === "violation"
      ? "❌ 위반"
      : analysis.status === "warning"
      ? "⚠️ 주의"
      : "✅ 적법"
  }\n`;
  report += `📄 대상: ${title}\n🔗 ${url}\n\n`;

  if (analysis.violations && analysis.violations.length > 0) {
    for (const v of analysis.violations) {
      report += `━━━━━━━━━━━━━━━━━━━\n`;
      report += `📜 [대전제] ${v.article}\n`;
      report += `📌 [소전제] 탐지 문구: "${v.keyword}"\n`;
      report += `⚖️ [결론] ${v.description}\n\n`;
    }
  }

  if (analysis.summary) {
    report += `━━━━━━━━━━━━━━━━━━━\n`;
    report += `💡 종합: ${analysis.summary}\n`;
  }

  report += `\n⚠️ 참고용 AI 분석입니다. 최종 판단은 변호사에게 확인하세요.`;
  return report;
}
