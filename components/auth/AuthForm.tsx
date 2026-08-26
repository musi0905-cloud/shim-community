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
 */
export function AuthForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const [state, formAction] = useActionState<AuthActionState, FormData>(
    ACTION[mode],
    AUTH_INITIAL_STATE,
  );

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
      <form action={formAction} className={styles.form} key={mode}>
        <TextField
          id="email"
          name="email"
          type="email"
          label="이메일"
          placeholder="you@example.com"
          autoComplete="email"
          required
          defaultValue={state.email}
          errorMessage={state.status === "error" ? state.message : undefined}
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
          />
        ) : null}

        <SubmitButton mode={mode} />
      </form>

      <div className={styles.switcher}>
        {mode === "signin" ? (
          <>
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => setMode("signup")}
            >
              처음이신가요? 가입하기
            </button>
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => setMode("reset")}
            >
              비밀번호를 아직 만들지 않았나요?
            </button>
          </>
        ) : (
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => setMode("signin")}
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
