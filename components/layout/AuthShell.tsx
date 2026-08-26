import type { ReactNode } from "react";
import { BRAND_NAME, BRAND_SUBTITLE } from "@/lib/constants";
import styles from "./AuthShell.module.css";

interface AuthShellProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * 로그인·온보딩 화면의 껍데기.
 * 네비게이션을 두지 않는다. 이 화면에서 할 일은 하나뿐이다.
 */
export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.panel}>
        {/* 이름과 부제를 한 줄로 붙이지 않는다. 두 줄 계층으로 둔다. */}
        <div className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            {BRAND_NAME}
          </span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>{BRAND_NAME}</span>
            <span className={styles.brandSubtitle}>{BRAND_SUBTITLE}</span>
          </span>
        </div>

        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          {description ? (
            <p className={styles.description}>{description}</p>
          ) : null}
        </header>

        <main id="main-content">{children}</main>
      </div>
    </div>
  );
}
