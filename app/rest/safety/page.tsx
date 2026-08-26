import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { requireProfile } from "@/lib/auth/dal";
import { HIGH_RISK_GUIDANCE } from "@/lib/rest/safety";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "도움받기" };

/**
 * 고위험 표현이 감지됐을 때 일반 Rest 대신 먼저 보여주는 화면.
 *
 * 진단하지 않는다. 상담을 대신하지 않는다. 지금 연락할 수 있는 곳만 알려준다.
 * (docs/PRODUCT.md §13)
 */
export default async function SafetyPage() {
  await requireProfile();

  return (
    <AppShell activeId="home">
      <div className={styles.page}>
        <header className={styles.intro}>
          <h1 className={styles.title}>{HIGH_RISK_GUIDANCE.title}</h1>
          <p className={styles.body}>{HIGH_RISK_GUIDANCE.body}</p>
        </header>

        <SurfaceCard as="section" padding="comfortable">
          <h2 className={styles.sectionTitle}>지금 연락할 수 있는 곳</h2>
          <ul className={styles.contacts}>
            {HIGH_RISK_GUIDANCE.contacts.map((c) => (
              <li key={c.number} className={styles.contact}>
                <a className={styles.contactLink} href={`tel:${c.number}`}>
                  <span className={styles.contactName}>{c.name}</span>
                  <span className={styles.contactNumber}>{c.number}</span>
                </a>
                <span className={styles.contactNote}>{c.note}</span>
              </li>
            ))}
          </ul>
        </SurfaceCard>

        <p className={styles.note}>{HIGH_RISK_GUIDANCE.note}</p>

        <div className={styles.actions}>
          <ButtonLink href="/short-rest" variant="quiet" fullWidth>
            그래도 조금 쉬어볼게요
          </ButtonLink>
          <ButtonLink href="/" variant="quiet" fullWidth>
            홈으로
          </ButtonLink>
        </div>
      </div>
    </AppShell>
  );
}
