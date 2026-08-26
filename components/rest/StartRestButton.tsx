"use client";

import { useFormStatus } from "react-dom";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { startRest } from "@/app/rest/actions";

function Submit({ minutes }: { minutes: number }) {
  const { pending } = useFormStatus();
  return (
    <PrimaryButton type="submit" disabled={pending} fullWidth>
      {pending ? "여는 중…" : `${minutes}분 쉬어가기`}
    </PrimaryButton>
  );
}

export function StartRestButton({
  durationMinutes,
  postId,
}: {
  durationMinutes: number;
  postId?: string;
}) {
  return (
    <form action={startRest}>
      <input type="hidden" name="duration" value={durationMinutes} />
      {postId ? <input type="hidden" name="postId" value={postId} /> : null}
      <Submit minutes={durationMinutes} />
    </form>
  );
}
