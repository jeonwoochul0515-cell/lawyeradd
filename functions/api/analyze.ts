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

// ── 1차 필터: 강한 의심 키워드 (높은 위반 확률) ──
const STRONG_KEYWORDS = [
  // 제4조 제1호: 허위·과장
  "승소율", "100%", "성공률", "전승", "무패", "승소 보장", "승소보장",
  "99%", "98%", "95%", "90%", "처리율", "해결율", "해결률",
  "수천 건", "수백 건", "수천건", "수백건", "만 건 이상",
  "대한민국 대표", "업계 최고", "압도적", "독보적", "국내 유일",
  "실력파", "탁월한 실력", "놀라운 결과",
  // 제4조 제2호: 오해유발
  "대형 로펌 출신", "대형로펌 출신",
  // 제4조 제7호: 사건·의뢰인 표시
  "의뢰인 후기", "고객 후기", "고객후기", "의뢰인후기",
  "승소 사례", "승소사례", "판결문", "실제 사례", "실제사례",
  "처분 결과", "선고 결과", "선처 사례",
  // 제4조 제8호: 공무원 관계 암시
  "검찰 출신", "검찰출신", "법원 출신", "법원출신",
  "검사 출신", "검사출신", "판사 출신", "판사출신",
  "前 검사", "前 판사", "前검사", "前판사",
  "전직 검사", "전직 판사", "전직검사", "전직판사",
  // 제4조 제10호: 보수액 관련
  "최저가", "할인", "쿠폰", "후불", "환불", "분할납부",
  "착수금 없", "착수금없", "착수금 0", "수익금",
  "견적", "입찰", "비교견적", "파격", "특별 할인", "특별할인",
  "저렴한 비용", "합리적 비용", "착한 비용", "비용 부담 없",
  "수임료 할인", "착수금 할인", "성공보수만", "후불제",
  // 제4조 제11호: 무료·염가
  "무료 상담", "무료상담", "무료 법률상담", "무료법률상담",
  "0원", "공짜", "무료 견적", "무료견적",
  "첫 상담 무료", "첫상담 무료", "이벤트", "프로모션",
  "상담 무료", "무료 전화상담", "무료전화상담",
  // 제4조 제12호: 결과 예측
  "무죄 보장", "승소 확신", "반드시", "100% 해결", "확실한 결과",
  "불기소 보장", "집행유예 보장", "무죄보장", "승소확신",
  "불기소보장", "집행유예보장", "선처 가능", "감형 가능",
  "높은 확률", "거의 확실", "무죄 가능", "기소유예 가능",
  "벌금으로 마무리", "집행유예로", "승소 가능성",
  "좋은 결과", "최선의 결과", "원하시는 결과",
  // 제7조: 전관
  "전관", "전관예우", "전관 변호사", "전관변호사",
  // 제9조 제2항: 최고·유일
  "최고", "유일", "최초", "넘버원", "No.1", "1위",
  "최다", "최대", "선두", "리딩", "베스트",
  "대한민국 1위", "업계 1위", "지역 1위",
  // 제5조: 광고방법
  "긴급", "지금 전화", "한정 상담", "오늘만", "마감 임박",
  "지금 바로", "서두르세요", "놓치지 마세요",
];

// ── 변호사 광고 감지 키워드 (이것이 감지되면 변호사 광고이므로 AI 분석 실행) ──
const LAWYER_AD_INDICATORS = [
  "변호사", "법무법인", "로펌", "법률사무소", "법률상담",
  "수임", "착수금", "성공보수", "사건 의뢰", "법률 서비스",
  "형사", "민사", "이혼", "상속", "교통사고",
  "음주운전", "성범죄", "마약", "사기", "횡령",
  "손해배상", "산업재해", "의료사고", "재산분할",
  "소송", "재판", "고소", "고발", "변론",
];

function preFilter(text: string): { strongHits: string[]; isLawyerAd: boolean } {
  const lower = text.toLowerCase();
  const strongHits: string[] = [];
  for (const kw of STRONG_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      strongHits.push(kw);
    }
  }
  const isLawyerAd = LAWYER_AD_INDICATORS.some((kw) => lower.includes(kw.toLowerCase()));
  return { strongHits, isLawyerAd };
}

// ── 분석 시스템 프롬프트 ──
const ANALYSIS_SYSTEM = `당신은 대한변호사협회 광고규정 위반 탐지 전문 AI입니다. 엄격하게 분석하세요.

[변호사 광고에 관한 규정 - 상세 조항 및 위반 예시]

## 제4조 (광고내용의 제한)
제1호 허위·과장: "승소율 99%", "수천건 처리", 검증 불가능한 수치나 과장된 실적 표현
제2호 오해유발: 자격/경력 과장, 전문분야 표시 시 오해를 불러올 수 있는 표현
제3호 비방·비교: 다른 변호사/법무법인을 직간접적으로 비교하거나 비방
제4호 품위훼손: 변호사 품위를 훼손하는 선정적·자극적 표현
제7호 사건·의뢰인: 수임 사건 결과, 의뢰인 정보 표시 (승소 사례 게시, 고객 후기, 판결 결과 공개)
제8호 공무원관계 암시: "검찰 출신", "前 판사", "법원 경력" 등 공직 경력을 내세워 영향력 암시
제10호 보수액: 수임 질서를 해치는 저가 경쟁 유도 ("최저가", "할인", "파격 비용", "착수금 0원")
제11호 무료·염가: 무료 법률상담/서비스 광고 (공익 목적 예외)
제12호 결과예측: "무죄 가능", "집행유예로", "좋은 결과", "승소 가능성" 등 결과를 예측하거나 보장

## 제5조 (광고방법의 제한)
시간적 압박: "긴급", "지금 바로", "오늘만", "놓치지 마세요" 등 불안 조성
불특정 다수 접촉 유도

## 제7조 (전관 관련 규정)
전관 강조: "전관 변호사", "전관예우" 명시적 표현
공직 경력 과도 강조: 검사/판사 출신을 반복 강조하여 공직 영향력 암시

## 제9조 제2항 (최고/유일 금지)
"최고", "유일", "최초", "No.1", "1위", "최다", "최대", "독보적", "대한민국 대표" 등

## 제10조 (무료·염가 법률상담 광고)
무료 상담, 0원 상담, 첫 상담 무료 등 (공익 목적 예외)

## 주의 깊게 탐지해야 할 패턴
1. 수치를 사용한 과장: 검증 불가능한 건수, 경력 년수 과장, 승소율/성공률
2. 결과 보장성 표현: 직접적이지 않더라도 "좋은 결과를 이끌어", "최선의 결과", "원하시는 결과"
3. 감정 호소형 압박: "힘드시죠?", "포기하지 마세요", "지금 바로 연락"
4. 공직 경력 강조: "검찰 N년", "법원 경력", "출신" 등으로 영향력 암시
5. 비용 경쟁 유도: "합리적 비용", "부담 없는", "저렴한", "착한 비용"
6. 후기/사례 게시: 의뢰인 후기, 승소 사례 상세 게시, 판결 결과 공개
7. 전문성 과장: 근거 없는 "전문", "특화", "센터" 등 오해유발 표현

## 분석 지시

주어진 텍스트에서 위반 의심 문구를 **빠짐없이 모두** 찾으세요. 의심스러우면 warning으로 표시하세요.
반드시 아래 JSON만 출력하세요.

{
  "status": "clean" | "warning" | "violation",
  "violations": [
    {
      "article": "제X조 제X호",
      "type": "violation" | "warning",
      "keyword": "원문에서 발견된 정확한 문구",
      "description": "위반 이유 (한 줄)"
    }
  ],
  "summary": "삼단논법 요약 (대전제→소전제→결론 형식, 200자 이내)"
}

- violation: 명백한 규정 위반 (확실한 금지 문구 사용)
- warning: 위반 가능성이 있어 주의 필요 (암시적·간접적 표현)
- clean: 위반 사항 없음 (명확히 적법한 경우에만)
- violations 배열이 비어있으면 status는 반드시 "clean"
- 하나라도 violation이면 status는 "violation", warning만 있으면 "warning"
- 가능한 한 엄격하게 판단하되, 명백히 적법한 정보성 콘텐츠는 clean 처리`;

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
    const { strongHits, isLawyerAd } = preFilter(text);

    // 변호사 광고가 아니고 의심 키워드도 없으면 → clean 처리 (비용 절감)
    if (strongHits.length === 0 && !isLawyerAd) {
      return Response.json({
        success: true,
        data: {
          status: "clean",
          violations: [],
          analysisText:
            "📜 [대전제] 변호사 광고에 관한 규정은 허위·과장·결과예측 등을 금지합니다.\n" +
            "📌 [소전제] 이 페이지는 변호사 광고로 식별되지 않았습니다.\n" +
            "⚖️ [결론] ✅ 변호사 광고 비해당. 분석 대상 아님.",
          suspectKeywords: [],
          apiCalled: false,
        },
      });
    }

    // 2차 AI 정밀 분석 (변호사 광고이면 무조건 AI 호출)
    const truncatedText = text.slice(0, 3000);
    const keywordHint = strongHits.length > 0
      ? `\n[1차 필터 의심 키워드] ${strongHits.join(", ")}`
      : "\n[1차 필터] 강한 의심 키워드 미탐지 - 텍스트 전체 맥락에서 미묘한 위반을 집중 분석하세요";
    const userMessage = `다음 변호사 광고 텍스트를 분석하세요.

[URL] ${url}
[제목] ${title}${keywordHint}

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
      const fallbackKws = strongHits.length > 0 ? strongHits : ["전체 텍스트"];
      analysis = {
        status: "warning",
        violations: fallbackKws.map((kw) => ({
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
        suspectKeywords: strongHits,
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
