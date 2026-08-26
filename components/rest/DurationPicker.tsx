"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { startRest } from "@/app/rest/actions";
import { RECOMMENDED_REST_DURATION, REST_DURATIONS } from "@/lib/constants";
import styles from "./DurationPicker.module.css";

function Submit({ minutes }: { minutes: number }) {
  const { pending } = useFormStatus();
  return (
    <PrimaryButton type="submit" disabled={pending} fullWidth>
      {pending ? "여는 중…" : `${minutes}분 쉬어가기`}
    </PrimaryButton>
  );
}

/**
 * 쉼 시간 고르기.
 * 10분을 조용히 권하되 기본 선택으로 만들지 않는다. 고르는 건 사용자다.
 */
export function DurationPicker() {
  const [minutes, setMinutes] = useState<number>(RECOMMENDED_REST_DURATION);

  return (
    <form action={startRest} className={styles.form}>
      <input type="hidden" name="duration" value={minutes} />

      <div
        className={styles.options}
        role="group"
        aria-label="쉼 시간"
      >
        {REST_DURATIONS.map((d) => {
          const selected = d === minutes;
          return (
            <button
              key={d}
              type="button"
              className={
                selected ? `${styles.option} ${styles.selected}` : styles.option
              }
              aria-pressed={selected}
              onClick={() => setMinutes(d)}
            >
              <span className={styles.value}>{d}분</span>
              {d === RECOMMENDED_REST_DURATION ? (
                <span className={styles.note}>천천히 걷기 좋은 시간</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <Submit minutes={minutes} />
    </form>
  );
}
