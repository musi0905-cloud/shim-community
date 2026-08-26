"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TextField } from "@/components/ui/TextField";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { sendMagicLink } from "@/app/auth/actions";
import {
  AUTH_INITIAL_STATE,
  type AuthActionState,
} from "@/lib/auth/form-state";
import styles from "./AuthForm.module.css";

/**
 * 제출 버튼.
 * useFormStatus 로 pending 을 읽어 두 번 눌리는 것을 막는다.
 * 상위에서 isPending 을 내려주면 prop drilling 이 되므로 여기서 직접 읽는다.
 */
function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <PrimaryButton type="submit" disabled={pending} fullWidth>
      {pending ? pendingLabel : label}
    </PrimaryButton>
  );
}

export function AuthForm() {
  const [state, formAction] = useActionState<AuthActionState, FormData>(
    sendMagicLink,
    AUTH_INITIAL_STATE,
  );

  if (state.status === "sent") {
    return (
      <div className={styles.sentWrap}>
        <SurfaceCard tone="soft" padding="comfortable">
          <p className={styles.sentTitle}>메일을 보냈어요.</p>
          <p className={styles.sentBody}>
            {state.email}로 보낸 링크를 열면 로그인돼요.
            메일이 보이지 않으면 스팸함도 한 번 확인해주세요.
          </p>
        </SurfaceCard>

        {/* 재발송은 같은 폼을 다시 제출하는 것으로 처리한다.
            이메일 값을 hidden 으로 넘겨 다시 입력하지 않게 한다. */}
        <form action={formAction} className={styles.resendForm}>
          <input type="hidden" name="email" value={state.email ?? ""} />
          <SubmitButton label="메일 다시 보내기" pendingLabel="보내는 중…" />
        </form>

        <p className={styles.note}>
          링크는 잠시 뒤에 만료돼요. 만료되면 다시 보내면 됩니다.
        </p>
      </div>
    );
  }

  return (
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
        errorMessage={state.status === "error" ? state.message : undefined}
        hint="비밀번호는 없어요. 메일로 받은 링크로 로그인합니다."
      />
      <SubmitButton label="로그인 링크 받기" pendingLabel="보내는 중…" />
    </form>
  );
}
