import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { NicknameSettingsForm } from "@/components/auth/NicknameSettingsForm";
import { PasswordSettingsForm } from "@/components/auth/PasswordSettingsForm";
import { requireProfile } from "@/lib/auth/dal";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/form-state";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "설정" };

export default async function SettingsPage() {
  const profile = await requireProfile();

  return (
    <AppShell activeId="home">
      <div className={styles.page}>
        <h1 className={styles.title}>설정</h1>

        <SurfaceCard as="section" padding="comfortable">
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>내 이름</h2>
            <NicknameSettingsForm current={profile.nickname} />
            <p className={styles.note}>
              쉼 안에서만 쓰는 이름이에요. 다른 기기에서 로그인해도 같은 이름으로
              이어집니다.
            </p>
          </div>
        </SurfaceCard>

        <SurfaceCard as="section" padding="comfortable">
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>비밀번호</h2>
            <PasswordSettingsForm minLength={PASSWORD_MIN_LENGTH} />
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
            {/*
              눌리는 버튼으로 두지 않는다. auth.users 를 지우려면 service_role
              이 필요한데, 그 키를 이 앱에 두지 않기로 했다.
              자세한 사유와 계획은 docs/ARCHITECTURE.md 「계정 삭제」 참고.
            */}
            <div className={styles.row}>
              <span className={styles.pending}>준비 중</span>
              <p className={styles.note}>
                계정과 기록을 완전히 지우는 기능은 아직 준비하고 있어요. 지금
                필요하시면 문의해주시면 직접 처리해드릴게요.
              </p>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </AppShell>
  );
}
