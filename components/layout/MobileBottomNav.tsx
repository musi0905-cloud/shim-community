"use client";

import Link from "next/link";
import { NAV_ITEMS } from "@/lib/constants";
import type { NavItemId } from "@/lib/types";
import { NavIcon } from "./NavIcon";
import styles from "./MobileBottomNav.module.css";

interface MobileBottomNavProps {
  activeId: NavItemId;
  onNavigate: (id: NavItemId) => void;
}

export function MobileBottomNav({ activeId, onNavigate }: MobileBottomNavProps) {
  return (
    <nav className={styles.nav} aria-label="주요 메뉴">
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
              <span className={styles.label}>{item.label}</span>
            </>
          );

          return (
            <li key={item.id} className={styles.item}>
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
    </nav>
  );
}
