"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TextField } from "@/components/ui/TextField";
import { updateNickname } from "@/app/settings/actions";
import {
  SETTINGS_INITIAL_STATE,
  type SettingsActionState,
} from "@/lib/auth/form-state";
import { NICKNAME_MAX_LENGTH } from "@/lib/nickname";
import styles from "./SettingsForms.module.css";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <PrimaryButton type="submit" variant="quiet" disabled={pending}>
      {pending ? "바꾸는 중…" : "이름 바꾸기"}
    </PrimaryButton>
  );
}

export function NicknameSettingsForm({ current }: { current: string }) {
  const [state, formAction] = useActionState<SettingsActionState, FormData>(
    updateNickname,
    SETTINGS_INITIAL_STATE,
  );
  const isMine = state.field === "nickname";

  return (
    <form action={formAction} className={styles.form}>
      <TextField
        id="nickname"
        name="nickname"
        label="쉼에서 쓰는 이름"
        defaultValue={current}
        maxLength={NICKNAME_MAX_LENGTH * 2}
        autoComplete="off"
        required
        errorMessage={isMine && state.status === "error" ? state.message : undefined}
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
