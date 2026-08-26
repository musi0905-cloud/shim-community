"use client";

import type { ReactNode } from "react";
import { usePlatformCapabilities } from "@/lib/usePlatformCapabilities";
import type { NavItemId } from "@/lib/types";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { RightContextPanel } from "./RightContextPanel";
import { SessionSync } from "@/components/auth/SessionSync";
import styles from "./AppShell.module.css";

interface AppShellProps {
  children: ReactNode;
  /** 서버가 알려주는 현재 화면. */
  activeId?: NavItemId;
  /** 넓은 화면의 선택적 우측 패널. */
  showContextPanel?: boolean;
}

/**
 * 반응형 Shell.
 * - Mobile(<1024px): 하단 Bottom Navigation
 * - Desktop(>=1024px): 얇은 좌측 Sidebar
 * - >=1280px: 선택적 우측 Context Panel
 *
 * NAV_ITEMS 다섯 항목 모두 실제 route 다. 죽은 링크가 없다.
 */
export function AppShell({
  children,
  activeId = "home",
  showContextPanel = false,
}: AppShellProps) {
  const { isStandalonePWA } = usePlatformCapabilities();

  return (
    // 설치형(standalone)에서는 브라우저 주소창이 없어 위 여백을 조금 더 준다.
    <div className={styles.shell} data-standalone={isStandalonePWA || undefined}>
      {/* 다른 탭에서 로그인/로그아웃하면 이 탭도 따라간다. */}
      <SessionSync />

      <DesktopSidebar activeId={activeId} />

      <div className={styles.contentArea}>
        <main className={styles.main} id="main-content">
          {children}
        </main>
        {showContextPanel ? <RightContextPanel /> : null}
      </div>

      <MobileBottomNav activeId={activeId} />
    </div>
  );
}
