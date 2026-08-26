"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { RestTimer } from "./RestTimer";
import styles from "./RestSessionView.module.css";

/**
 * 쉼 화면. 최대한 비워 둔다.
 *
 * 타이머가 끝나면 서버 컴포넌트를 다시 그려 완료 상태를 반영한다.
 * 완료 기록 자체는 [그만 쉬기] 또는 완료 후 버튼이 서버 액션으로 남긴다.
 */
export function RestSessionView({
  endsAt,
  completed,
}: {
  endsAt: string;
  completed: boolean;
}) {
  const router = useRouter();
  const handleFinished = useCallback(() => {
    router.refresh();
  }, [router]);

  if (completed) {
    return (
      <div className={styles.wrap}>
        <p className={styles.doneTitle}>쉼을 마쳤어요.</p>
        <p className={styles.doneBody}>오늘도 수고했어요.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <RestTimer endsAt={endsAt} onFinished={handleFinished} />
    </div>
  );
}
