"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { StateCard } from "@/components/ui/StateCard";
import { MOOD_STATES } from "@/lib/constants";
import type { MoodStateId } from "@/lib/types";
import styles from "./MoodStateSelector.module.css";

/**
 * 오늘의 상태를 하나 고르고 Write 로 넘어간다.
 *
 * 고른 값은 아직 저장하지 않는다. 새로고침해서 선택이 사라지면 다시 고르면
 * 된다 — 저장되지 않은 상태를 굳이 붙잡아 두지 않는다.
 * state 는 query 로 넘기되 /write 가 서버에서 허용된 값인지 다시 확인한다.
 */
export function MoodStateSelector() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<MoodStateId | null>(null);
  const [isPending, startTransition] = useTransition();

  function goNext() {
    if (selectedId === null) return;
    startTransition(() => {
      router.push(`/write?state=${selectedId}`);
    });
  }

  return (
    <section className={styles.section} aria-labelledby="mood-legend">
      <p id="mood-legend" className={styles.legend}>
        하나만 골라주세요. 정확하지 않아도 괜찮아요.
      </p>

      <div className={styles.list}>
        {MOOD_STATES.map((state) => (
          <StateCard
            key={state.id}
            label={state.label}
            hint={state.hint}
            selected={state.id === selectedId}
            onSelect={() => setSelectedId(state.id)}
          />
        ))}
      </div>

      <div className={styles.footer}>
        <PrimaryButton disabled={selectedId === null || isPending} onClick={goNext}>
          {isPending ? "여는 중…" : "다음"}
        </PrimaryButton>
        <p className={styles.status} role="status">
          {selectedId === null
            ? "상태를 고르면 다음으로 넘어갈 수 있어요."
            : "천천히 눌러도 괜찮아요."}
        </p>
      </div>
    </section>
  );
}
