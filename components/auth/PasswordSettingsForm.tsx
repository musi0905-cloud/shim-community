"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TextField } from "@/components/ui/TextField";
import { updatePassword } from "@/app/settings/actions";
import {
  SETTINGS_INITIAL_STATE,
  type SettingsActionState,
} from "@/lib/auth/form-state";
import styles from "./SettingsForms.module.css";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <PrimaryButton type="submit" variant="quiet" disabled={pending}>
      {pending ? "저장하는 중…" : "비밀번호 저장하기"}
    </PrimaryButton>
  );
}

/**
 * 비밀번호 설정/변경.
 *
 * "이미 비밀번호가 있는지" 를 추측하지 않는다. Supabase 는 그걸 알려주는
 * 공개 필드를 주지 않는다. 그래서 있는 척/없는 척 하지 않고, 두 경우 모두에
 * 맞는 문구를 쓴다. 로그인된 세션에서 updateUser 를 부르므로 어느 쪽이든
 * 계정과 닉네임은 그대로 유지된다 — 새 계정이 생기지 않는다.
 */
export function PasswordSettingsForm({ minLength }: { minLength: number }) {
  const [state, formAction] = useActionState<SettingsActionState, FormData>(
    updatePassword,
    SETTINGS_INITIAL_STATE,
  );
  const isMine = state.field === "password";

  return (
    <form action={formAction} className={styles.form}>
      <p className={styles.hint}>
        비밀번호가 아직 없다면 여기서 만들고, 이미 있다면 여기서 바꿔요.
        만들고 나면 다음부터는 이메일과 비밀번호로 바로 들어올 수 있어요.
      </p>

      <TextField
        id="password"
        name="password"
        type="password"
        label="새 비밀번호"
        autoComplete="new-password"
        required
        minLength={minLength}
        hint={`${minLength}자 이상이면 돼요.`}
        errorMessage={isMine && state.status === "error" ? state.message : undefined}
      />
      <TextField
        id="passwordConfirm"
        name="passwordConfirm"
        type="password"
        label="비밀번호 확인"
        autoComplete="new-password"
        required
        minLength={minLength}
      />

      {isMine && state.status === "success" ? (
        <p className={styles.success} role="status">
          {state.message}
        </p>
      ) : null}

      <Submit />
    </form>
  );
}
