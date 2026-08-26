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
 * routed 로 갈라 둔다. 아직 페이지가 없는 항목에 href 를 들려 보내면
 * 죽은 링크가 된다. typedRoutes 가 존재하지 않는 route 를 타입 단계에서
 * 거부하므로, 페이지를 만들기 전에는 href 를 가질 수 없게 한다.
 */
export type NavItem = RoutedNavItem | PlannedNavItem;

interface NavItemBase {
  id: NavItemId;
  label: string;
  /** 아이콘 전용 표현이 아닐 때도 스크린리더 문맥을 보강한다. */
  description: string;
}

/** 실제 페이지가 있는 항목. <Link> 로 이동한다. */
export interface RoutedNavItem extends NavItemBase {
  routed: true;
  href: Route;
}

/** 아직 페이지가 없는 항목. 이동하지 않는다. */
export interface PlannedNavItem extends NavItemBase {
  routed: false;
  /** 페이지가 생기면 쓸 주소. 기록용이며 링크에 쓰지 않는다. */
  plannedPath: string;
}

export type NavItemId = "home" | "write" | "shared-day" | "my-rest" | "short-rest";
