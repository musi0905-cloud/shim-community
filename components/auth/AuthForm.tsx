"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TextField } from "@/components/ui/TextField";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import {
  sendPasswordReset,
  signInWithPassword,
  signUpWithPassword,
} from "@/app/auth/actions";
import {
  AUTH_INITIAL_STATE,
  PASSWORD_MIN_LENGTH,
  type AuthActionState,
  type AuthField,
} from "@/lib/auth/form-state";
import styles from "./AuthForm.module.css";

type Mode = "signin" | "signup" | "reset";

const ACTION: Record<
  Mode,
  (prev: AuthActionState, formData: FormData) => Promise<AuthActionState>
> = {
  signin: signInWithPassword,
  signup: signUpWithPassword,
  reset: sendPasswordReset,
};

const SUBMIT_LABEL: Record<Mode, { idle: string; pending: string }> = {
  signin: { idle: "로그인", pending: "들어가는 중…" },
  signup: { idle: "가입하고 시작하기", pending: "만드는 중…" },
  reset: { idle: "비밀번호 설정 메일 받기", pending: "보내는 중…" },
};

function SubmitButton({ mode }: { mode: Mode }) {
  const { pending } = useFormStatus();
  const label = SUBMIT_LABEL[mode];
  return (
    <PrimaryButton type="submit" disabled={pending} fullWidth>
      {pending ? label.pending : label.idle}
    </PrimaryButton>
  );
}

/**
 * 로그인 · 가입 · 비밀번호 재설정을 한 화면에서 처리한다.
 *
 * 화면을 나누면 지친 사람에게 이동이 하나 더 생긴다. 대신 어떤 모드인지
 * 항상 분명히 보이게 한다.
 *
 * 모드를 바꾸면 Fields 가 통째로 다시 마운트된다(key={mode}). 이전 모드에서
 * 난 오류가 다음 모드 화면에 남아 있지 않게 하려는 것이다.
 */
export function AuthForm() {
  const [mode, setMode] = useState<Mode>("signin");
  return <AuthFormFields key={mode} mode={mode} onModeChange={setMode} />;
}

function AuthFormFields({
  mode,
  onModeChange,
}: {
  mode: Mode;
  onModeChange: (next: Mode) => void;
}) {
  const [state, formAction] = useActionState<AuthActionState, FormData>(
    ACTION[mode],
    AUTH_INITIAL_STATE,
  );

  /**
   * 이 칸의 오류인가.
   *
   * 오류 문구는 그 문구가 가리키는 입력에만 붙인다. 예전에는 전부 email 에
   * 붙어서, 비밀번호 오류가 이메일 칸의 오류로 announce 됐다. (QA-232 / 233)
   */
  const errorFor = (field: AuthField): string | undefined =>
    state.status === "error" && state.field === field ? state.message : undefined;

  /** 특정 칸을 지목할 수 없는 오류. 폼 전체 오류로 따로 보여준다. */
  const formError =
    state.status === "error" && state.field === undefined ? state.message : undefined;

  if (state.status === "sent") {
    return (
      <div className={styles.sentWrap}>
        <SurfaceCard tone="soft" padding="comfortable">
          <p className={styles.sentTitle}>메일을 보냈어요.</p>
          <p className={styles.sentBody}>
            {state.email}로 보낸 링크를 열면 이어서 진행돼요. 메일이 보이지 않으면
            스팸함도 한 번 확인해주세요.
          </p>
        </SurfaceCard>
        <p className={styles.note}>
          링크는 잠시 뒤에 만료돼요. 만료되면 다시 받으면 됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <form action={formAction} className={styles.form}>
        <TextField
          id="email"
          name="email"
          type="email"
          label="이메일"
          placeholder="you@example.com"
          autoComplete="email"
          required
          defaultValue={state.email}
          errorMessage={errorFor("email")}
        />

        {mode !== "reset" ? (
          <TextField
            id="password"
            name="password"
            type="password"
            label="비밀번호"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={mode === "signup" ? PASSWORD_MIN_LENGTH : undefined}
            hint={
              mode === "signup"
                ? `${PASSWORD_MIN_LENGTH}자 이상이면 돼요.`
                : undefined
            }
            errorMessage={errorFor("password")}
          />
        ) : null}

        {mode === "signup" ? (
          <TextField
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            label="비밀번호 확인"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            errorMessage={errorFor("passwordConfirm")}
          />
        ) : null}

        {/*
          어느 칸인지 지목할 수 없는 오류가 오는 자리.
          로그인 실패는 "이메일이 틀렸다" 와 "비밀번호가 틀렸다" 를 구분해
          알려주면 안 되므로(계정 열거) 여기로 온다. 우리 쪽 장애도 마찬가지다.
        */}
        {formError ? (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        ) : null}

        <SubmitButton mode={mode} />
      </form>

      <div className={styles.switcher}>
        {mode === "signin" ? (
          <>
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => onModeChange("signup")}
            >
              처음이신가요? 가입하기
            </button>
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => onModeChange("reset")}
            >
              비밀번호를 아직 만들지 않았나요?
            </button>
          </>
        ) : (
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => onModeChange("signin")}
          >
            이미 계정이 있어요. 로그인하기
          </button>
        )}
      </div>

      {mode === "reset" ? (
        <p className={styles.note}>
          예전에 메일 링크로만 로그인했다면 비밀번호가 아직 없어요. 여기서 만들면
          다음부터는 비밀번호로 들어올 수 있어요.
        </p>
      ) : null}
    </div>
  );
}
