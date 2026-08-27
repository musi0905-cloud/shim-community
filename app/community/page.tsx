import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { FeedCard } from "@/components/community/FeedCard";
import { requireProfile } from "@/lib/auth/dal";
import { getFeed, getMyReactions, getReactionCounts } from "@/lib/data/posts";
import { FEED_PAGE_SIZE } from "@/lib/constants";
import { decodeFeedCursor, encodeFeedCursor } from "@/lib/community/cursor";
import type { ReactionType } from "@/lib/types";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "함께한 하루" };

const EMPTY_COUNTS: Record<ReactionType, number> = { heart: 0, leaf: 0, cup: 0 };

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ after?: string; before?: string }>;
}) {
  await requireProfile();

  const { after, before } = await searchParams;

  // 커서는 URL 에서 온다. 형식이 이상하면 조용히 첫 장으로 돌아간다.
  const backwardCursor = decodeFeedCursor(before);
  const forwardCursor = decodeFeedCursor(after);
  const backward = backwardCursor !== null;
  const cursor = backwardCursor ?? forwardCursor;

  const { items, hasMore, hasPrevious, nextCursor, previousCursor } =
    await getFeed(cursor, backward, FEED_PAGE_SIZE);
  const postIds = items.map((i) => i.post_id);
  const [counts, mine] = await Promise.all([
    getReactionCounts(postIds),
    getMyReactions(postIds),
  ]);

  return (
    <AppShell activeId="shared-day">
      <div className={styles.page}>
        <header className={styles.intro}>
          <h1 className={styles.title}>함께한 하루</h1>
          <p className={styles.description}>
            비슷한 하루를 보낸 사람들의 한 줄이에요. 오래 머물 필요는 없어요.
          </p>
        </header>

        {items.length === 0 ? (
          <SurfaceCard tone="soft" padding="roomy">
            <p className={styles.empty}>
              {cursor === null
                ? "아직 올라온 글이 없어요. 오늘의 첫 한 줄을 남겨보실래요?"
                : "더 이상 글이 없어요."}
            </p>
          </SurfaceCard>
        ) : (
          <ul className={styles.list}>
            {items.map((item) => (
              <FeedCard
                key={item.post_id}
                item={item}
                counts={counts.get(item.post_id) ?? EMPTY_COUNTS}
                mine={[...(mine.get(item.post_id) ?? [])]}
              />
            ))}
          </ul>
        )}

        {/* Infinite Scroll 을 쓰지 않는다. 멈출 지점을 사용자가 정한다. */}
        <nav className={styles.pager} aria-label="페이지 이동">
          {hasPrevious && previousCursor ? (
            <ButtonLink
              href={`/community?before=${encodeFeedCursor(previousCursor)}`}
              variant="quiet"
            >
              이전
            </ButtonLink>
          ) : null}
          {hasMore && nextCursor ? (
            <ButtonLink
              href={`/community?after=${encodeFeedCursor(nextCursor)}`}
              variant="quiet"
            >
              조금 더 보기
            </ButtonLink>
          ) : null}
        </nav>
      </div>
    </AppShell>
  );
}
