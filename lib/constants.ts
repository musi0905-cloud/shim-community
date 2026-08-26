import type {
  MoodState,
  MoodStateId,
  NavItem,
  ReactionType,
} from "@/lib/types";

/**
 * 브랜드.
 *
 * 이름과 부제를 한 줄로 붙여 쓰지 않는다. "쉼: 나만의 공간" 같은 표기는
 * 쓰지 않고, 화면에서는 두 줄 계층으로 놓는다.
 *
 *   쉼
 *   나만의 공간
 *
 * BRAND_TITLE 은 브라우저 탭처럼 한 줄이 강제되는 곳에서만 쓴다.
 * BRAND_MESSAGE 는 Landing 같은 브랜드 화면에서만 쓴다 — 앱 안쪽 화면마다
 * 반복하면 카피가 아니라 소음이 된다.
 *
 * 기술 식별자(저장소·Vercel·Supabase 이름)는 여전히 shim-community 다.
 * 브랜드를 바꿨다고 인프라를 rename 하지 않는다.
 */
export const BRAND_NAME = "쉼";
export const BRAND_SUBTITLE = "나만의 공간";
export const BRAND_MESSAGE = "도파민보다, 쉼.";
export const BRAND_DESCRIPTION = "오늘의 마음을 잠깐 내려놓는 곳.";

/** 한 줄 표기가 강제되는 곳(브라우저 탭, OG title)에서만. */
export const BRAND_TITLE = `${BRAND_NAME} — ${BRAND_SUBTITLE}`;

/** manifest / theme-color / 브라우저 UI와 globals.css 토큰을 한 곳에서 맞춘다. */
export const BRAND_COLORS = {
  background: "#f7f5f1",
  theme: "#3f6e57",
} as const;

/**
 * Shell 네비게이션.
 *
 * Sprint 2 에서 다섯 화면이 전부 실제 route 로 연결됐다.
 * typedRoutes 가 존재하지 않는 route 를 타입 단계에서 거부하므로,
 * 여기 href 가 살아 있다는 것 자체가 그 페이지가 있다는 뜻이다.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  {
    id: "home",
    label: "홈",
    href: "/",
    description: "오늘의 상태를 고르는 곳",
  },
  {
    id: "write",
    label: "글쓰기",
    href: "/write",
    description: "마음에 남은 말을 적는 곳",
  },
  {
    id: "shared-day",
    label: "함께한 하루",
    href: "/community",
    description: "같은 하루를 보낸 사람들의 기록",
  },
  {
    id: "my-rest",
    label: "내 쉼",
    href: "/my-rest",
    description: "내가 지나온 쉼의 기록",
  },
  {
    id: "short-rest",
    label: "짧은 쉼",
    href: "/short-rest",
    description: "지금 바로 할 수 있는 짧은 쉼",
  },
] as const;

/** 홈의 상태 카드. 순서는 프로토타입 기준을 그대로 따른다. */
export const MOOD_STATES: readonly MoodState[] = [
  {
    id: "long_day",
    label: "오늘 너무 길었어요",
    hint: "하루가 끝났는데도 아직 안 끝난 것 같을 때",
  },
  {
    id: "tired_of_people",
    label: "사람에게 지쳤어요",
    hint: "말을 많이 한 날, 마음이 더 조용해질 때",
  },
  {
    id: "too_many_thoughts",
    label: "생각이 많아요",
    hint: "머릿속이 좀처럼 정리되지 않을 때",
  },
  {
    id: "no_energy",
    label: "아무것도 하기 싫어요",
    hint: "해야 할 일이 멀게 느껴질 때",
  },
  {
    id: "want_quiet",
    label: "그냥 조용히 있고 싶어요",
    hint: "아무 설명도 하고 싶지 않을 때",
  },
  {
    id: "okay_today",
    label: "오늘은 괜찮아요",
    hint: "괜찮은 날에도 쉼은 필요하니까",
  },
] as const;

/** 설정 화면. 네비게이션 목록과 별개로 접근한다. */
export const SETTINGS_HREF = "/settings";

/** 글 한 줄의 길이 제한. DB check constraint 와 같은 값이다. */
export const POST_MIN_LENGTH = 1;
export const POST_MAX_LENGTH = 200;

/** 고를 수 있는 쉼 시간. DB check constraint 와 같은 값이다. */
export const REST_DURATIONS = [3, 5, 10] as const;
/** 10분을 조용히 권한다. 강조하거나 기본 선택으로 만들지는 않는다. */
export const RECOMMENDED_REST_DURATION = 10;

/** Community Feed 한 번에 보여줄 개수. Infinite Scroll 을 쓰지 않는다. */
export const FEED_PAGE_SIZE = 15;

/** 내 쉼에서 되돌아볼 기간. */
export const MY_REST_DAYS = 7;

interface ReactionMeta {
  type: ReactionType;
  label: string;
  /** 합계를 SNS 처럼 강조하지 않고 문장으로 쓴다. */
  summary: (count: number) => string;
}

export const REACTIONS: readonly ReactionMeta[] = [
  {
    type: "heart",
    label: "나도 그래요",
    summary: (n) => `${n}명도 같은 마음이었어요.`,
  },
  {
    type: "leaf",
    label: "같이 쉬어요",
    summary: (n) => `${n}명이 함께 머물렀어요.`,
  },
  {
    type: "cup",
    label: "오늘도 수고했어요",
    summary: (n) => `${n}명이 수고했다고 전했어요.`,
  },
] as const;

/** MoodStateId 로 라벨을 찾는다. 저장된 글을 다시 보여줄 때 쓴다. */
export function moodLabel(id: MoodStateId): string {
  return MOOD_STATES.find((s) => s.id === id)?.label ?? "오늘의 마음";
}

/** 신뢰할 수 없는 입력(query 등)이 실제 상태값인지 확인한다. */
export function isMoodStateId(value: unknown): value is MoodStateId {
  return (
    typeof value === "string" && MOOD_STATES.some((s) => s.id === value)
  );
}
