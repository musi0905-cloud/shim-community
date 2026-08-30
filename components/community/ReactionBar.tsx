"use client";

import { useFormStatus } from "react-dom";
import { toggleReaction } from "@/app/community/actions";
import { REACTIONS } from "@/lib/constants";
import type { ReactionType } from "@/lib/types";
import styles from "./ReactionBar.module.css";

function ReactionButton({
  postId,
  type,
  label,
  active,
}: {
  postId: string;
  type: ReactionType;
  label: string;
  active: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      // formAction 이 서버 액션 "참조"일 때, React 는 버튼의 name/value 를
      // 그대로 FormData 키로 넘기지 않는다(하이드레이션 후 name 속성이
      // 내부 액션 id 로 바뀐다 — DevTools 에서 실제로 확인함). 그래서
      // reactionType/postId 가 formData.get() 으로 전혀 도착하지 않았고,
      // toggleReaction 은 매번 조용히 아무 것도 하지 않은 채 끝났다.
      // .bind() 로 값을 직접 실어 보내는 것이 Next.js 가 문서화한 방식이다
      // (여러 버튼이 같은 서버 액션을 공유하되 버튼마다 다른 값을 줘야 할 때).
      formAction={toggleReaction.bind(null, postId, type)}
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
        {REACTIONS.map((r) => (
          <ReactionButton
            key={r.type}
            postId={postId}
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
