import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { WriteForm } from "@/components/write/WriteForm";
import { MoodStateSelector } from "@/components/home/MoodStateSelector";
import { requireProfile } from "@/lib/auth/dal";
import { isMoodStateId, moodLabel } from "@/lib/constants";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "글쓰기" };

export default async function WritePage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  await requireProfile();
  const { state } = await searchParams;

  // query 는 사용자가 바꿀 수 있다. 허용된 상태가 아니면 여기서 고르게 한다.
  // 홈으로 되돌리지 않는 이유: 네비게이션에서 바로 들어온 사람에게는
  // 튕겨나가는 것처럼 보이기 때문이다.
  if (!isMoodStateId(state)) {
    return (
      <AppShell activeId="write">
        <div className={styles.page}>
          <header className={styles.intro}>
            <h1 className={styles.title}>오늘은 어떤 하루였나요?</h1>
            <p className={styles.description}>
              먼저 지금 마음에 가장 가까운 하나를 골라주세요.
            </p>
          </header>
          <MoodStateSelector />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeId="write">
      <div className={styles.page}>
        <SurfaceCard tone="soft" padding="comfortable">
          <p className={styles.stateLabel}>오늘의 마음</p>
          <p className={styles.stateValue}>{moodLabel(state)}</p>
        </SurfaceCard>

        <WriteForm state={state} />
      </div>
    </AppShell>
  );
}
