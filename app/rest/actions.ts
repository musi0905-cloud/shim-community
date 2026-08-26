"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/dal";
import {
  completeRestSession,
  getRestSession,
  startRestSession,
} from "@/lib/data/posts";
import { REST_DURATIONS } from "@/lib/constants";
import type { RestDuration } from "@/lib/types";

function parseDuration(value: FormDataEntryValue | null): RestDuration | null {
  const n = Number(value);
  return (REST_DURATIONS as readonly number[]).includes(n)
    ? (n as RestDuration)
    : null;
}

/**
 * 쉼을 시작한다.
 *
 * 끝나는 시각(ends_at)은 서버가 정한다. 클라이언트 타이머를 신뢰하지 않으므로
 * 화면을 껐다 켜도, 백그라운드로 갔다 와도 남은 시간이 흔들리지 않는다.
 */
export async function startRest(formData: FormData) {
  const profile = await requireProfile();

  const duration = parseDuration(formData.get("duration"));
  if (duration === null) redirect("/short-rest");

  const rawPostId = formData.get("postId");
  const postId = typeof rawPostId === "string" && rawPostId.length > 0 ? rawPostId : null;

  const session = await startRestSession(profile.user_id, duration, postId);
  revalidatePath("/my-rest");
  redirect(`/rest/session/${session.id}`);
}

/** 쉼을 마쳤다고 기록한다. */
export async function finishRest(formData: FormData) {
  await requireProfile();

  const raw = formData.get("sessionId");
  const sessionId = typeof raw === "string" ? raw : "";

  // RLS 가 남의 세션을 돌려주지 않는다. 없으면 조용히 홈으로.
  const session = await getRestSession(sessionId);
  if (!session) redirect("/");

  if (session.completed_at === null) {
    await completeRestSession(session.id);
  }

  revalidatePath("/my-rest");
  redirect(`/rest/session/${session.id}?done=1`);
}
