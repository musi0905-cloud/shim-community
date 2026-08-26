"use client";

import { useFormStatus } from "react-dom";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { finishRest } from "@/app/rest/actions";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <PrimaryButton type="submit" variant="quiet" disabled={pending} fullWidth>
      {pending ? "마무리하는 중…" : label}
    </PrimaryButton>
  );
}

export function FinishRestButton({
  sessionId,
  label,
}: {
  sessionId: string;
  label: string;
}) {
  return (
    <form action={finishRest}>
      <input type="hidden" name="sessionId" value={sessionId} />
      <Submit label={label} />
    </form>
  );
}
