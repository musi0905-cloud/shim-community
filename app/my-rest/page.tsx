import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { requireProfile } from "@/lib/auth/dal";
import { getMyPosts, getMyRestSessions } from "@/lib/data/posts";
import { moodLabel, MY_REST_DAYS } from "@/lib/constants";
import { relativeTime } from "@/lib/relativeTime";
import type { MoodStateId } from "@/lib/types";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "내 쉼" };

export default async function MyRestPage() {
  await requireProfile();

  const [posts, sessions] = await Promise.all([
    getMyPosts(MY_REST_DAYS),
    getMyRestSessions(MY_REST_DAYS),
  ]);

  // 글에 이어진 쉼을 찾기 위한 색인.
  const restByPost = new Map(
    sessions.filter((s) => s.post_id !== null).map((s) => [s.post_id as string, s]),
  );

  // 7일 요약. 차트를 만들지 않는다 — 문장 몇 줄이면 충분하다.
  const stateCounts = new Map<MoodStateId, number>();
  for (const p of posts) {
    stateCounts.set(p.state, (stateCounts.get(p.state) ?? 0) + 1);
  }
  const topStates = [...stateCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const completedRests = sessions.filter((s) => s.completed_at !== null).length;

  return (
    <AppShell activeId="my-rest">
      <div className={styles.page}>
        <header className={styles.intro}>
          <h1 className={styles.title}>내 쉼</h1>
          <p className={styles.description}>
            최근 {MY_REST_DAYS}일 동안 내려놓은 기록이에요.
          </p>
        </header>

        {posts.length > 0 || sessions.length > 0 ? (
          <SurfaceCard tone="soft" as="section" padding="comfortable">
            <h2 className={styles.summaryTitle}>지난 {MY_REST_DAYS}일</h2>
            <ul className={styles.summaryList}>
              {topStates.map(([state, count]) => (
                <li key={state}>
                  {moodLabel(state)} {count}번
                </li>
              ))}
              {completedRests > 0 ? (
                <li>쉼을 끝까지 마친 날 {completedRests}번</li>
              ) : null}
            </ul>
          </SurfaceCard>
        ) : null}

        {posts.length === 0 ? (
          <SurfaceCard padding="roomy">
            <p className={styles.empty}>
              아직 기록이 없어요. 오늘의 마음을 한 줄로 남겨보실래요?
            </p>
            <div className={styles.emptyAction}>
              <ButtonLink href="/">홈으로</ButtonLink>
            </div>
          </SurfaceCard>
        ) : (
          <ul className={styles.list}>
            {posts.map((post) => {
              const rest = restByPost.get(post.id);
              return (
                <SurfaceCard as="li" key={post.id} padding="comfortable">
                  <div className={styles.head}>
                    <span className={styles.state}>{moodLabel(post.state)}</span>
                    <time className={styles.time} dateTime={post.created_at}>
                      {relativeTime(post.created_at)}
                    </time>
                  </div>
                  <p className={styles.content}>{post.content}</p>
                  <p className={styles.meta}>
                    {rest
                      ? rest.completed_at !== null
                        ? `${rest.duration_minutes}분 쉼을 마쳤어요`
                        : `${rest.duration_minutes}분 쉼을 시작했어요`
                      : "아직 쉼을 하지 않았어요"}
                    {post.moderation_status !== "approved"
                      ? " · 이 글은 나만 볼 수 있어요"
                      : ""}
                  </p>
                </SurfaceCard>
              );
            })}
          </ul>
        )}

        <p className={styles.note}>
          더 이전 기록을 되돌아보는 기능은 준비 중이에요.
        </p>
      </div>
    </AppShell>
  );
}
