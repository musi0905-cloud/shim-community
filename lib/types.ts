import type { Route } from "next";

/**
 * 도메인 타입.
 * Supabase row 는 이 shape 에 맞춰 매핑한다.
 */

/**
 * 지속 익명 정체성.
 * 닉네임의 source of truth 는 이 row 이며 localStorage 가 아니다.
 * email 은 여기에 두지 않는다 — auth.users 에만 존재한다.
 */
export interface Profile {
  user_id: string;
  nickname: string;
  created_at: string;
  updated_at: string;
}

/**
 * AI Rest 응답 (PO-003).
 * Backend/Domain 은 이 구조를 다루고, Frontend 는 3영역으로 렌더링한다.
 * Sprint 1 범위가 아니며 타입만 미리 둔다.
 */
export interface RestPlan {
  /** 짧은 공감 */
  acknowledgement: string;
  /** 지금 할 수 있는 구체적인 쉼 행동 1개 */
  action: {
    type: string;
    duration_minutes: number;
    instruction: string;
  };
  /** 휴대폰을 내려놓도록 안내하는 메시지 */
  closing: string;
}

/** 홈에서 고르는 오늘의 상태. */
export interface MoodState {
  /** 저장 시 사용할 안정적인 key. UI 문구가 바뀌어도 이 값은 유지한다. */
  id: MoodStateId;
  label: string;
  /** 카드 아래 한 줄. 판단하지 않고, 설명하지 않는다. */
  hint: string;
}

export type MoodStateId =
  | "long_day"
  | "tired_of_people"
  | "too_many_thoughts"
  | "no_energy"
  | "want_quiet"
  | "okay_today";

/**
 * Shell 네비게이션 항목.
 *
 * href 는 typedRoutes 의 Route 라서 존재하지 않는 경로를 넣을 수 없다.
 * 즉 여기 항목이 있다는 것은 그 페이지가 실제로 있다는 뜻이다.
 */
export interface NavItem {
  id: NavItemId;
  label: string;
  href: Route;
  /** 아이콘만으로 부족한 문맥을 스크린리더에 보강한다. */
  description: string;
}

export type NavItemId = "home" | "write" | "shared-day" | "my-rest" | "short-rest";

/** 저장된 한 줄. */
export interface Post {
  id: string;
  user_id: string;
  state: MoodStateId;
  content: string;
  moderation_status: ModerationStatus;
  created_at: string;
}

/**
 * Safety 분류 결과가 글의 공개 범위를 정한다.
 * approved 만 Community 로 나가고, 나머지도 본인에게는 계속 보인다.
 */
export type ModerationStatus = "approved" | "review" | "restricted";

/** Safety 판정. 진단이 아니라 공개 범위와 안내 화면을 고르기 위한 분류다. */
export type SafetyLevel = "NORMAL" | "REVIEW" | "HIGH_RISK";

export const MODERATION_BY_SAFETY: Record<SafetyLevel, ModerationStatus> = {
  NORMAL: "approved",
  REVIEW: "review",
  HIGH_RISK: "restricted",
};

/** 저장된 Rest Plan. */
export interface AiSuggestion {
  id: string;
  user_id: string;
  post_id: string;
  acknowledgement: string;
  action_type: string;
  duration_minutes: RestDuration;
  instruction: string;
  closing: string;
  provider: string;
  created_at: string;
}

export type RestDuration = 3 | 5 | 10;

/** 실제 쉼 세션. 남은 시간은 ends_at 기준으로 계산한다. */
export interface RestSession {
  id: string;
  user_id: string;
  post_id: string | null;
  duration_minutes: RestDuration;
  started_at: string;
  ends_at: string;
  completed_at: string | null;
  created_at: string;
}

export type ReactionType = "heart" | "leaf" | "cup";

/** Community Feed 한 장. public view 가 내보내는 컬럼과 1:1 이다. */
export interface FeedItem {
  post_id: string;
  user_id: string;
  nickname: string;
  state: MoodStateId;
  content: string;
  created_at: string;
}
