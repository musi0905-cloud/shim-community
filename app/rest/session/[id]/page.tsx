import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { RestSessionView } from "@/components/rest/RestSessionView";
import { FinishRestButton } from "@/components/rest/FinishRestButton";
import { requireProfile } from "@/lib/auth/dal";
import { getRestSession } from "@/lib/data/posts";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "쉼" };

export default async function RestSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireProfile();
  const { id } = await params;

  const session = await getRestSession(id);
  if (!session) notFound();

  // 완료 기록이 있거나, 끝나는 시각이 지났으면 끝난 것으로 본다.
  const ended =
    session.completed_at !== null || new Date(session.ends_at).getTime() <= Date.now();

  return (
    <AppShell activeId="short-rest">
      <div className={styles.page}>
        <RestSessionView endsAt={session.ends_at} completed={ended} />

        <div className={styles.actions}>
          {ended ? (
            <>
              {session.completed_at === null ? (
                <FinishRestButton sessionId={session.id} label="쉼 마치기" />
              ) : null}
              <ButtonLink href="/community" fullWidth>
                다른 사람들의 하루 보기
              </ButtonLink>
              <ButtonLink href="/" variant="quiet" fullWidth>
                홈으로
              </ButtonLink>
            </>
          ) : (
            <FinishRestButton sessionId={session.id} label="그만 쉬기" />
          )}
        </div>
      </div>
    </AppShell>
  );
}
