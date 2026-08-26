"use client";

import { useFormStatus } from "react-dom";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { signOut } from "@/app/settings/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <PrimaryButton type="submit" variant="quiet" disabled={pending}>
      {pending ? "나가는 중…" : "로그아웃"}
    </PrimaryButton>
  );
}

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Submit />
    </form>
  );
}
