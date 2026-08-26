"use client";

import { useEffect, useState } from "react";
import styles from "./RestTimer.module.css";

/**
 * 남은 시간.
 *
 * setTimeout 으로 카운트를 누적하지 않는다. 화면이 백그라운드로 가면 타이머가
 * 느려지거나 멈추기 때문이다. 매 tick 마다 ends_at - now 를 다시 계산하므로
 * 잠갔다 열어도, 탭을 옮겼다 와도 값이 맞다.
 *
 * 첫 렌더에서는 시간을 계산하지 않는다. 서버가 그린 초와 브라우저가 붙는
 * 순간의 초가 달라 hydration 이 깨지기 때문이다(React #418).
 * 마운트된 뒤에 계산을 시작한다.
 */
export function RestTimer({
  endsAt,
  onFinished,
}: {
  endsAt: string;
  onFinished?: () => void;
}) {
  const end = new Date(endsAt).getTime();
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const next = Math.max(0, end - Date.now());
      setRemainingMs(next);
      return next;
    };

    if (tick() <= 0) {
      onFinished?.();
      return;
    }

    const id = window.setInterval(() => {
      if (tick() <= 0) {
        window.clearInterval(id);
        onFinished?.();
      }
    }, 1000);

    return () => window.clearInterval(id);
  }, [end, onFinished]);

  // 마운트 전에는 서버와 같은 문자열을 그린다.
  if (remainingMs === null) {
    return (
      <div className={styles.wrap}>
        <p className={styles.time} aria-hidden="true">
          --:--
        </p>
        <p className={styles.hint}>이제 화면을 내려놓아도 괜찮아요.</p>
      </div>
    );
  }

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const done = remainingMs <= 0;

  return (
    <div className={styles.wrap}>
      {/* 진행률 막대를 두지 않는다. 남은 시간을 계속 확인하게 만들지 않으려고. */}
      <p
        className={styles.time}
        role="timer"
        aria-live="off"
        aria-label={done ? "쉼이 끝났어요" : `${minutes}분 ${seconds}초 남았어요`}
      >
        {done ? "쉼 끝" : `${minutes}:${String(seconds).padStart(2, "0")}`}
      </p>
      <p className={styles.hint}>
        {done
          ? "돌아오셨네요. 조금 나아졌길 바라요."
          : "이제 화면을 내려놓아도 괜찮아요."}
      </p>
    </div>
  );
}
