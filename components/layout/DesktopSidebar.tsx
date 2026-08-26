"use client";

import Link from "next/link";
import { APP_NAME, NAV_ITEMS, SETTINGS_HREF } from "@/lib/constants";
import type { NavItemId } from "@/lib/types";
import { NavIcon } from "./NavIcon";
import styles from "./DesktopSidebar.module.css";

interface DesktopSidebarProps {
  activeId: NavItemId;
  onNavigate: (id: NavItemId) => void;
}

export function DesktopSidebar({ activeId, onNavigate }: DesktopSidebarProps) {
  return (
    <nav className={styles.sidebar} aria-label="주요 메뉴">
      <div className={styles.brand}>
        <span className={styles.brandName}>{APP_NAME}</span>
        <span className={styles.brandNote}>잠시 멈추는 곳</span>
      </div>

      <ul className={styles.list}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === activeId;
          const className = isActive
            ? `${styles.link} ${styles.active}`
            : styles.link;
          const label = `${item.label} — ${item.description}`;
          const inner = (
            <>
              <NavIcon id={item.id} />
              <span>{item.label}</span>
              <span className={styles.marker} aria-hidden="true" />
            </>
          );

          return (
            <li key={item.id}>
              {item.routed ? (
                <Link
                  href={item.href}
                  className={className}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={label}
                >
                  {inner}
                </Link>
              ) : (
                // 아직 페이지가 없다. 링크로 만들면 404 가 되므로 이동시키지 않는다.
                <button
                  type="button"
                  className={className}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={label}
                  onClick={() => onNavigate(item.id)}
                >
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <div className={styles.footer}>
        <Link className={styles.settingsLink} href={SETTINGS_HREF}>
          설정
        </Link>
        <p className={styles.footerNote}>오래 머물지 않아도 괜찮아요.</p>
      </div>
    </nav>
  );
}
