import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { requireProfile } from "@/lib/auth/dal";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "설정" };

export default async function SettingsPage() {
  // 로그인 + 닉네임이 모두 있어야 한다. 없으면 각각 /auth, 온보딩으로 보낸다.
  const profile = await requireProfile();

  return (
    <AppShell activeId="home">
      <div className={styles.page}>
        <h1 className={styles.title}>설정</h1>

        <SurfaceCard as="section" padding="comfortable">
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>내 이름</h2>
            <p className={styles.nickname}>{profile.nickname}</p>
            <p className={styles.note}>
              쉼 안에서만 쓰는 이름이에요. 다른 기기에서 로그인해도 같은 이름으로
              이어집니다.
            </p>
          </div>
        </SurfaceCard>

        <SurfaceCard as="section" padding="comfortable">
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>계정</h2>
            <div className={styles.row}>
              <SignOutButton />
              <p className={styles.note}>
                로그아웃해도 이름과 기록은 그대로 남아요.
              </p>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard as="section" tone="soft" padding="comfortable">
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>계정 삭제</h2>
            <div className={styles.row}>
              {/*
                아직 실제 삭제를 구현하지 않았다. 눌리는 버튼으로 두면
                동작하지 않는 버튼이 되므로, 준비 중임을 그대로 보여준다.
              */}
              <span className={styles.pending}>준비 중</span>
              <p className={styles.note}>
                계정과 기록을 완전히 지우는 기능은 아직 준비하고 있어요.
              </p>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </AppShell>
  );
}
