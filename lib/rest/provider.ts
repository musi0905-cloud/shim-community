import type { MoodStateId, RestDuration } from "@/lib/types";

/**
 * Rest Plan 생성기.
 *
 * PO-003 대로 Backend 는 구조화된 Rest Plan 을 다루고, 화면은 이걸 3영역으로
 * 렌더링한다. AI 는 상담사가 아니라 "쉼 디렉터" 이므로 대화를 시작하지 않는다.
 *
 * 지금 붙어 있는 제공자는 규칙 기반이다. OpenAI 같은 실제 모델을 붙일 때는
 * 이 파일에 RestPlanProvider 를 하나 더 구현하고 getRestPlanProvider() 가
 * 그걸 고르게 하면 된다. 호출부는 인터페이스만 안다.
 *
 * **API key 가 없어도 사용자 흐름은 절대 막히지 않는다.** 그게 이 구조의 이유다.
 */

export interface RestPlanInput {
  state: MoodStateId;
  content: string;
}

export interface RestPlanResult {
  acknowledgement: string;
  action: {
    type: string;
    duration_minutes: RestDuration;
    instruction: string;
  };
  closing: string;
  /** 어떤 제공자가 만들었는지. DB 에 그대로 저장한다. */
  provider: string;
}

export interface RestPlanProvider {
  readonly name: string;
  create(input: RestPlanInput): Promise<RestPlanResult>;
}

/** 상태별 기본 쉼. 상태를 판단하지 않고, 지금 할 수 있는 행동 하나만 준다. */
const RULES: Record<
  MoodStateId,
  {
    acknowledgement: string;
    type: string;
    duration: RestDuration;
    instruction: string;
  }
> = {
  long_day: {
    acknowledgement: "오늘 하루가 참 길었네요.",
    type: "slow_walk",
    duration: 10,
    instruction:
      "지금은 무언가를 더 하기보다, 창문을 열고 10분만 천천히 걸어보는 건 어때요? 목적지는 없어도 괜찮아요.",
  },
  tired_of_people: {
    acknowledgement: "오늘 사람들에게 많이 지친 하루였네요.",
    type: "quiet_music_walk",
    duration: 10,
    instruction:
      "지금은 누군가와 더 이야기하기보다, 좋아하는 음악 한 곡을 들으며 10분만 천천히 걸어보는 건 어때요?",
  },
  too_many_thoughts: {
    acknowledgement: "머릿속이 좀처럼 정리되지 않는 날이네요.",
    type: "write_down_and_breathe",
    duration: 5,
    instruction:
      "떠오르는 생각을 종이에 그냥 쏟아내듯 적어두고, 5분만 숨을 천천히 쉬어보세요. 정리하지 않아도 괜찮아요.",
  },
  no_energy: {
    acknowledgement: "아무것도 하고 싶지 않은 날이 있어요.",
    type: "lie_down",
    duration: 5,
    instruction:
      "아무것도 하지 않아도 돼요. 5분만 눈을 감고 편한 자세로 누워 있어보세요.",
  },
  want_quiet: {
    acknowledgement: "지금은 아무 말도 하고 싶지 않은 순간이네요.",
    type: "silence",
    duration: 5,
    instruction:
      "설명하지 않아도 괜찮아요. 5분만 소리를 끄고 조용한 곳에 앉아 있어보세요.",
  },
  okay_today: {
    acknowledgement: "괜찮은 하루였다니 다행이에요.",
    type: "short_breather",
    duration: 3,
    instruction:
      "괜찮은 날에도 쉼은 필요해요. 3분만 하던 일을 멈추고 창밖을 바라보세요.",
  },
};

const CLOSING =
  "이제 휴대폰은 잠시 내려놓고, 단 몇 분이라도 나를 위해 쉬어봐요.";

/**
 * 규칙 기반 제공자.
 * 글 내용을 해석하지 않고 상태만 본다. 해석하는 척하지 않기 위해서다.
 */
const ruleProvider: RestPlanProvider = {
  name: "rule",
  async create({ state }) {
    const rule = RULES[state];
    return {
      acknowledgement: rule.acknowledgement,
      action: {
        type: rule.type,
        duration_minutes: rule.duration,
        instruction: rule.instruction,
      },
      closing: CLOSING,
      provider: "rule",
    };
  },
};

/**
 * 지금 쓸 제공자를 고른다.
 *
 * 실제 모델을 붙이면 여기서 key 유무를 보고 고르면 된다. key 가 없으면
 * 규칙 기반으로 조용히 내려앉는다 — 흐름이 멈추는 것보다 낫다.
 */
export function getRestPlanProvider(): RestPlanProvider {
  return ruleProvider;
}
