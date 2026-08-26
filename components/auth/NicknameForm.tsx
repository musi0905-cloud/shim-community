"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TextField } from "@/components/ui/TextField";
import {
  NICKNAME_MAX_LENGTH,
  NICKNAME_SUGGESTIONS,
  validateNickname,
} from "@/lib/nickname";
import { createProfile } from "@/app/onboarding/nickname/actions";
import {
  NICKNAME_INITIAL_STATE,
  type NicknameActionState,
} from "@/lib/auth/form-state";
import styles from "./NicknameForm.module.css";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <PrimaryButton type="submit" disabled={disabled || pending} fullWidth>
      {pending ? "저장하는 중…" : "이 이름으로 시작하기"}
    </PrimaryButton>
  );
}

/**
 * 닉네임 정하기.
 *
 * 두 가지 방법을 한 화면에 둔다.
 *   A. 추천 이름 고르기 — 한 번 누르면 끝난다.
 *   B. 직접 입력
 *
 * 추천을 누르면 입력칸에 값이 들어가므로, 제출 경로는 하나뿐이다.
 * 서버는 어느 쪽이든 같은 규칙으로 다시 검증한다.
 */
export function NicknameForm() {
  const [state, formAction] = useActionState<NicknameActionState, FormData>(
    createProfile,
    NICKNAME_INITIAL_STATE,
  );
  const [value, setValue] = useState(state.value ?? "");

  // 서버 응답 전에도 명백한 문제는 알려준다. 최종 판단은 서버가 한다.
  const localResult = validateNickname(value);
  const canSubmit = localResult.ok;
  const length = [...value.normalize("NFC").trim()].length;

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.suggestions}>
        <p className={styles.legend} id="suggestion-legend">
          마음에 드는 이름을 골라도 좋아요.
        </p>
        <div className={styles.chips} role="group" aria-labelledby="suggestion-legend">
          {NICKNAME_SUGGESTIONS.map((suggestion) => {
            const selected = value === suggestion;
            return (
              <button
                key={suggestion}
                type="button"
                className={
                  selected ? `${styles.chip} ${styles.chipSelected}` : styles.chip
                }
                aria-pressed={selected}
                onClick={() => setValue(suggestion)}
              >
                {suggestion}
              </button>
            );
          })}
        </div>
      </div>

      <p className={styles.divider}>또는</p>

      <TextField
        id="nickname"
        name="nickname"
        label="직접 입력"
        placeholder="쉼에서 쓸 이름"
        autoComplete="off"
        maxLength={NICKNAME_MAX_LENGTH * 2}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        errorMessage={state.status === "error" ? state.message : undefined}
        hint={`현실의 이름을 적지 않아도 괜찮아요. ${length}/${NICKNAME_MAX_LENGTH}자`}
      />

      <SubmitButton disabled={!canSubmit} />
    </form>
  );
}
