import { redirect } from "next/navigation";
import Link from "next/link";
import { MoodStateSelector } from "@/components/home/MoodStateSelector";
import { Landing } from "@/components/home/Landing";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/dal";
import { SETTINGS_HREF } from "@/lib/constants";
import styles from "./page.module.css";

/**
 * auth-aware root.
 *
 * 로그인 여부에 따라 Landing 과 Home 을 한 주소에서 나눈다.
 * 로그인한 사람이 매번 /home 으로 튕기는 대신 "/" 가 곧 자기 자리가 된다.
 * (route 결정 근거는 docs/ARCHITECTURE.md 「라우트 구조」)
 */
export default async function RootPage() {
  const user = await getCurrentUser();
  if (!user) return <Landing />;

  const profile = await getCurrentProfile();
  // 로그인은 했지만 아직 이름이 없다 — 온보딩을 먼저 끝낸다.
  if (!profile) redirect("/onboarding/nickname");

  return (
    <AppShell activeId="home" showContextPanel>
      <div className={styles.page}>
        <div className={styles.greeting}>
          <span className={styles.avatar} aria-hidden="true">
            쉼
          </span>
          <span className={styles.greetingText}>
            <span className={styles.nickname}>{profile.nickname}</span>
            <span className={styles.nicknameNote}> 님, 안녕하세요</span>
          </span>
          <Link className={styles.settingsLink} href={SETTINGS_HREF}>
            설정
          </Link>
        </div>

        <header className={styles.intro}>
          <h1 className={styles.title}>오늘은 어떤 하루였나요?</h1>
          <p className={styles.description}>
            지금 마음에 가장 가까운 하나를 골라주세요. 고르고 나면, 지금 할 수 있는
            짧은 쉼 하나를 안내해드릴게요.
          </p>
        </header>

        <MoodStateSelector />
      </div>
    </AppShell>
  );
}
