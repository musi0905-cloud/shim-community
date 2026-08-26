"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { submitPost } from "@/app/write/actions";
import { WRITE_INITIAL_STATE, type WriteActionState } from "@/lib/auth/form-state";
import { POST_MAX_LENGTH } from "@/lib/constants";
import type { MoodStateId } from "@/lib/types";
import styles from "./WriteForm.module.css";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <PrimaryButton type="submit" disabled={disabled || pending} fullWidth>
      {pending ? "내려놓는 중…" : "내려놓기"}
    </PrimaryButton>
  );
}

export function WriteForm({ state }: { state: MoodStateId }) {
  const [formState, formAction] = useActionState<WriteActionState, FormData>(
    submitPost,
    WRITE_INITIAL_STATE,
  );
  const [content, setContent] = useState(formState.value ?? "");

  const trimmed = content.normalize("NFC").trim();
  const length = [...trimmed].length;
  const tooLong = length > POST_MAX_LENGTH;
  const canSubmit = length > 0 && !tooLong;

  return (
    <form action={formAction} className={styles.form}>
      {/* 서버가 다시 검증하므로 이 값은 편의일 뿐이다. */}
      <input type="hidden" name="state" value={state} />

      <label className={styles.label} htmlFor="content">
        한 줄만 내려놓아도 괜찮아요.
      </label>
      <textarea
        id="content"
        name="content"
        className={
          formState.status === "error" || tooLong
            ? `${styles.textarea} ${styles.invalid}`
            : styles.textarea
        }
        rows={6}
        placeholder="정리되지 않아도 괜찮아요."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        aria-describedby="content-counter"
        aria-invalid={tooLong || formState.status === "error" || undefined}
      />

      <div className={styles.meta}>
        <p
          id="content-counter"
          className={tooLong ? `${styles.counter} ${styles.over}` : styles.counter}
        >
          {length} / {POST_MAX_LENGTH}자
        </p>
        {formState.status === "error" ? (
          <p className={styles.error} role="alert">
            {formState.message}
          </p>
        ) : null}
      </div>

      <SubmitButton disabled={!canSubmit} />

      <p className={styles.note}>
        적은 글은 나중에 「내 쉼」에서 다시 볼 수 있어요.
      </p>
    </form>
  );
}
