import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { DurationPicker } from "@/components/rest/DurationPicker";
import { requireProfile } from "@/lib/auth/dal";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "짧은 쉼" };

export default async function ShortRestPage() {
  await requireProfile();

  return (
    <AppShell activeId="short-rest">
      <div className={styles.page}>
        <header className={styles.intro}>
          <h1 className={styles.title}>얼마나 쉬어볼까요?</h1>
          <p className={styles.description}>
            길지 않아도 괜찮아요. 지금 낼 수 있는 만큼만 고르면 돼요.
          </p>
        </header>

        <DurationPicker />
      </div>
    </AppShell>
  );
}
