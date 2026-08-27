/**
 * 비밀번호 최소 길이.
 *
 * 복잡도 규칙(특수문자 필수 같은 것)을 걸지 않는다. 길이가 훨씬 중요하고,
 * 지친 사람에게 규칙 퍼즐을 내지 않는 편이 이 제품에 맞다.
 */
export const PASSWORD_MIN_LENGTH = 8;

/**
 * 서버 액션이 주고받는 폼 상태.
 *
 * "use server" 파일은 async 함수만 export 할 수 있으므로, 상수와 타입은
 * 여기에 둔다. 클라이언트 컴포넌트도 이 파일에서 초기값을 가져간다.
 */

/**
 * 어느 입력의 문제인지.
 *
 * 예전에는 이 구분이 없어서 모든 오류 문구가 email 입력에 붙었다.
 * "비밀번호가 서로 달라요" 가 이메일 칸의 오류로 announce 돼, 스크린리더
 * 사용자는 어느 칸을 고쳐야 하는지 알 수 없었다. (QA-232 / QA-233)
 *
 * undefined 는 "특정 입력의 문제가 아님" 을 뜻한다 — 이때는 폼 전체 오류로
 * 보여준다. 로그인 실패("이메일 또는 비밀번호를 확인해주세요")처럼 둘 중
 * 어느 쪽인지 알려주면 안 되는 경우가 여기 해당한다.
 */
export type AuthField = "email" | "password" | "passwordConfirm";

export interface AuthActionState {
  status: "idle" | "sent" | "error";
  /** 오류가 가리키는 입력. 없으면 폼 전체 오류. */
  field?: AuthField;
  /** 사용자에게 보여줄 문구. Supabase 원문 에러를 그대로 쓰지 않는다. */
  message?: string;
  /** 안내 문구에 다시 보여주기 위한 값. */
  email?: string;
}

export const AUTH_INITIAL_STATE: AuthActionState = { status: "idle" };

export interface NicknameActionState {
  status: "idle" | "error";
  message?: string;
  /** 실패 시 입력값을 되살려 다시 타이핑하지 않게 한다. */
  value?: string;
}

export const NICKNAME_INITIAL_STATE: NicknameActionState = { status: "idle" };

export interface WriteActionState {
  status: "idle" | "error";
  message?: string;
  /** 실패해도 적은 글이 사라지지 않게 되돌려준다. */
  value?: string;
}

export const WRITE_INITIAL_STATE: WriteActionState = { status: "idle" };

export interface SettingsActionState {
  status: "idle" | "success" | "error";
  /** 어느 폼의 결과인지. 한 화면에 폼이 여럿이라 구분이 필요하다. */
  field?: "nickname" | "password";
  message?: string;
}

export const SETTINGS_INITIAL_STATE: SettingsActionState = { status: "idle" };
