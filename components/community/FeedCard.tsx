import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { ReactionBar } from "./ReactionBar";
import { moodLabel } from "@/lib/constants";
import { relativeTime } from "@/lib/relativeTime";
import type { FeedItem, ReactionType } from "@/lib/types";
import styles from "./FeedCard.module.css";

/**
 * Feed 한 장.
 * 닉네임과 글만 보여준다. 이메일이나 다른 계정 정보는 애초에 오지 않는다
 * (community_feed view 가 컬럼을 고정한다).
 */
export function FeedCard({
  item,
  counts,
  mine,
}: {
  item: FeedItem;
  counts: Record<ReactionType, number>;
  mine: ReactionType[];
}) {
  return (
    <SurfaceCard as="li" padding="comfortable">
      <div className={styles.head}>
        <span className={styles.nickname}>{item.nickname}</span>
        <span className={styles.dot} aria-hidden="true">·</span>
        <span className={styles.state}>{moodLabel(item.state)}</span>
        <time className={styles.time} dateTime={item.created_at}>
          {relativeTime(item.created_at)}
        </time>
      </div>

      <p className={styles.content}>{item.content}</p>

      <ReactionBar postId={item.post_id} counts={counts} mine={mine} />
    </SurfaceCard>
  );
}
