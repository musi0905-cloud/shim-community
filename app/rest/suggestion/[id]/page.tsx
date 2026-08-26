import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { StartRestButton } from "@/components/rest/StartRestButton";
import { requireProfile } from "@/lib/auth/dal";
import { getSuggestion } from "@/lib/data/posts";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "쉼 제안" };

/**
 * Rest Plan 을 3영역으로 보여준다 (PO-003).
 *   1. 짧은 공감  2. 구체적인 쉼 행동 1개  3. 휴대폰을 내려놓도록 안내
 *
 * dynamic route 라서 새로고침해도 그대로 남는다.
 */
export default async function SuggestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireProfile();
  const { id } = await params;

  // RLS 가 남의 것을 돌려주지 않는다. 없으면 404 로 끝낸다.
  const suggestion = await getSuggestion(id);
  if (!suggestion) notFound();

  return (
    <AppShell activeId="home">
      <div className={styles.page}>
        <p className={styles.acknowledgement}>{suggestion.acknowledgement}</p>

        <SurfaceCard as="section" padding="roomy">
          <h1 className={styles.sectionTitle}>지금 할 수 있는 쉼</h1>
          <p className={styles.instruction}>{suggestion.instruction}</p>
        </SurfaceCard>

        <p className={styles.closing}>{suggestion.closing}</p>

        <div className={styles.actions}>
          <StartRestButton
            durationMinutes={suggestion.duration_minutes}
            postId={suggestion.post_id}
          />
          <ButtonLink href="/" variant="quiet" fullWidth>
            다음에 할게요
          </ButtonLink>
        </div>
      </div>
    </AppShell>
  );
}
