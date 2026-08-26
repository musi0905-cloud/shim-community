"use client";

import { useFormStatus } from "react-dom";
import { toggleReaction } from "@/app/community/actions";
import { REACTIONS } from "@/lib/constants";
import type { ReactionType } from "@/lib/types";
import styles from "./ReactionBar.module.css";

function ReactionButton({
  type,
  label,
  active,
}: {
  type: ReactionType;
  label: string;
  active: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="reactionType"
      value={type}
      formAction={toggleReaction}
      className={active ? `${styles.button} ${styles.active}` : styles.button}
      aria-pressed={active}
      disabled={pending}
    >
      <span className={styles.icon} aria-hidden="true">
        {type === "heart" ? "♡" : type === "leaf" ? "🌿" : "☕"}
      </span>
      <span>{label}</span>
    </button>
  );
}

/**
 * 반응 세 가지. 숫자를 크게 보여주지 않고 문장으로 전한다.
 * 합계는 view 에서 오고, 누가 눌렀는지는 오지 않는다.
 */
export function ReactionBar({
  postId,
  counts,
  mine,
}: {
  postId: string;
  counts: Record<ReactionType, number>;
  mine: ReactionType[];
}) {
  const total = REACTIONS.reduce((sum, r) => sum + (counts[r.type] ?? 0), 0);
  const leading = REACTIONS.filter((r) => (counts[r.type] ?? 0) > 0).sort(
    (a, b) => (counts[b.type] ?? 0) - (counts[a.type] ?? 0),
  )[0];

  return (
    <div className={styles.wrap}>
      <form className={styles.buttons}>
        <input type="hidden" name="postId" value={postId} />
        {REACTIONS.map((r) => (
          <ReactionButton
            key={r.type}
            type={r.type}
            label={r.label}
            active={mine.includes(r.type)}
          />
        ))}
      </form>

      {total > 0 && leading ? (
        <p className={styles.summary}>{leading.summary(counts[leading.type] ?? 0)}</p>
      ) : null}
    </div>
  );
}
