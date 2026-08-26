"use client";

import Link from "next/link";
import { BRAND_NAME, BRAND_SUBTITLE, NAV_ITEMS, SETTINGS_HREF } from "@/lib/constants";
import type { NavItemId } from "@/lib/types";
import { NavIcon } from "./NavIcon";
import styles from "./DesktopSidebar.module.css";

interface DesktopSidebarProps {
  activeId: NavItemId;
}

export function DesktopSidebar({ activeId }: DesktopSidebarProps) {
  return (
    <nav className={styles.sidebar} aria-label="주요 메뉴">
      <div className={styles.brand}>
        <span className={styles.brandName}>{BRAND_NAME}</span>
        <span className={styles.brandNote}>{BRAND_SUBTITLE}</span>
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
              <Link
                href={item.href}
                className={className}
                aria-current={isActive ? "page" : undefined}
                aria-label={label}
              >
                {inner}
              </Link>
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
