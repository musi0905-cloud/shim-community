import "server-only";

import { createClient } from "@/lib/supabase/server";
import { classify } from "@/lib/rest/safety";
import { getRestPlanProvider } from "@/lib/rest/provider";
import { MODERATION_BY_SAFETY } from "@/lib/types";
import type {
  AiSuggestion,
  FeedItem,
  MoodStateId,
  Post,
  ReactionType,
  RestDuration,
  RestSession,
  SafetyLevel,
} from "@/lib/types";

/**
 * 글·쉼 데이터 접근.
 *
 * 여기서도 user_id 는 항상 세션에서 온 값을 쓴다. 호출부가 넘긴 값을 믿지
 * 않는다. RLS 가 마지막으로 한 번 더 막지만, 서버에서 먼저 막는다.
 */

export interface CreatedPost {
  post: Post;
  suggestion: AiSuggestion;
  safety: SafetyLevel;
}

/**
 * 글을 저장하고 Rest Plan 까지 만든다.
 *
 * 순서가 중요하다 — Safety 를 먼저 보고, 그 결과가 공개 범위를 정한다.
 * 고위험이면 글은 남기되 Community 로 내보내지 않는다.
 */
export async function createPostWithSuggestion(
  userId: string,
  state: MoodStateId,
  content: string,
): Promise<CreatedPost> {
  const supabase = await createClient();

  const safety = classify(content);
  if (safety.level !== "NORMAL") {
    // 무엇이 걸렸는지는 서버 로그에만 남긴다. 사용자에게 보여주지 않는다.
    console.warn("[safety] 분류", { level: safety.level, matched: safety.matched });
  }

  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      user_id: userId,
      state,
      content,
      moderation_status: MODERATION_BY_SAFETY[safety.level],
    })
    .select("id, user_id, state, content, moderation_status, created_at")
    .single();

  if (postError || !post) {
    console.error("[posts] 저장 실패", {
      code: postError?.code,
      message: postError?.message,
    });
    throw new Error("POST_CREATE_FAILED");
  }

  const plan = await getRestPlanProvider().create({ state, content });

  const { data: suggestion, error: suggestionError } = await supabase
    .from("ai_suggestions")
    .insert({
      user_id: userId,
      post_id: post.id,
      acknowledgement: plan.acknowledgement,
      action_type: plan.action.type,
      duration_minutes: plan.action.duration_minutes,
      instruction: plan.action.instruction,
      closing: plan.closing,
      provider: plan.provider,
    })
    .select(
      "id, user_id, post_id, acknowledgement, action_type, duration_minutes, instruction, closing, provider, created_at",
    )
    .single();

  if (suggestionError || !suggestion) {
    console.error("[posts] Rest Plan 저장 실패", {
      code: suggestionError?.code,
      message: suggestionError?.message,
    });
    throw new Error("SUGGESTION_CREATE_FAILED");
  }

  return { post, suggestion, safety: safety.level };
}

/** 글 하나에 딸린 Rest Plan. 본인 것만 읽힌다(RLS). */
export async function getSuggestion(id: string): Promise<AiSuggestion | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_suggestions")
    .select(
      "id, user_id, post_id, acknowledgement, action_type, duration_minutes, instruction, closing, provider, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[posts] Rest Plan 조회 실패", { code: error.code });
    throw new Error("SUGGESTION_FETCH_FAILED");
  }
  return data;
}

/** 최근 N일 내 기록. */
export async function getMyPosts(days: number): Promise<Post[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, user_id, state, content, moderation_status, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[posts] 내 기록 조회 실패", { code: error.code });
    throw new Error("MY_POSTS_FETCH_FAILED");
  }
  return data ?? [];
}

/** 최근 N일 내 쉼 세션. */
export async function getMyRestSessions(days: number): Promise<RestSession[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rest_sessions")
    .select(
      "id, user_id, post_id, duration_minutes, started_at, ends_at, completed_at, created_at",
    )
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[rest] 세션 조회 실패", { code: error.code });
    throw new Error("REST_SESSIONS_FETCH_FAILED");
  }
  return data ?? [];
}

/** 쉼 세션을 연다. 끝나는 시각을 서버에서 정한다. */
export async function startRestSession(
  userId: string,
  durationMinutes: RestDuration,
  postId: string | null,
): Promise<RestSession> {
  const startedAt = new Date();
  const endsAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rest_sessions")
    .insert({
      user_id: userId,
      post_id: postId,
      duration_minutes: durationMinutes,
      started_at: startedAt.toISOString(),
      ends_at: endsAt.toISOString(),
    })
    .select(
      "id, user_id, post_id, duration_minutes, started_at, ends_at, completed_at, created_at",
    )
    .single();

  if (error || !data) {
    console.error("[rest] 세션 생성 실패", { code: error?.code });
    throw new Error("REST_SESSION_CREATE_FAILED");
  }
  return data;
}

export async function getRestSession(id: string): Promise<RestSession | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rest_sessions")
    .select(
      "id, user_id, post_id, duration_minutes, started_at, ends_at, completed_at, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[rest] 세션 조회 실패", { code: error.code });
    throw new Error("REST_SESSION_FETCH_FAILED");
  }
  return data;
}

/** 쉼을 마쳤다고 기록한다. 이미 기록돼 있으면 그대로 둔다. */
export async function completeRestSession(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("rest_sessions")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", id)
    .is("completed_at", null);

  if (error) {
    console.error("[rest] 세션 완료 실패", { code: error.code });
    throw new Error("REST_SESSION_COMPLETE_FAILED");
  }
}

// ── Community ─────────────────────────────────────────────────────────

export interface FeedPage {
  items: FeedItem[];
  /** 다음 장이 더 있는가. Infinite Scroll 대신 "조금 더 보기" 로 쓴다. */
  hasMore: boolean;
}

/**
 * Community Feed.
 *
 * posts 테이블이 아니라 community_feed view 에서 읽는다. view 가 approved 만,
 * 그리고 정해진 컬럼만 내보낸다. email 은 애초에 나올 수 없다.
 */
export async function getFeed(page: number, pageSize: number): Promise<FeedPage> {
  const from = page * pageSize;
  const supabase = await createClient();

  // 한 개 더 받아서 다음 장이 있는지 본다. count 쿼리를 따로 치지 않는다.
  const { data, error } = await supabase
    .from("community_feed")
    .select("post_id, user_id, nickname, state, content, created_at")
    .order("created_at", { ascending: false })
    .range(from, from + pageSize);

  if (error) {
    console.error("[community] feed 조회 실패", { code: error.code });
    throw new Error("FEED_FETCH_FAILED");
  }

  const rows = data ?? [];
  return { items: rows.slice(0, pageSize), hasMore: rows.length > pageSize };
}

export type ReactionCounts = Record<ReactionType, number>;

const EMPTY_COUNTS: ReactionCounts = { heart: 0, leaf: 0, cup: 0 };

/** 글별 반응 합계. 누가 눌렀는지는 나오지 않는다(view 가 막는다). */
export async function getReactionCounts(
  postIds: string[],
): Promise<Map<string, ReactionCounts>> {
  const result = new Map<string, ReactionCounts>();
  if (postIds.length === 0) return result;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("post_reaction_counts")
    .select("post_id, reaction_type, reaction_count")
    .in("post_id", postIds);

  if (error) {
    console.error("[community] 반응 합계 조회 실패", { code: error.code });
    // 합계를 못 읽었다고 Feed 전체를 막지 않는다. 0 으로 보여준다.
    return result;
  }

  for (const row of data ?? []) {
    const counts = result.get(row.post_id) ?? { ...EMPTY_COUNTS };
    counts[row.reaction_type as ReactionType] = row.reaction_count;
    result.set(row.post_id, counts);
  }
  return result;
}

/** 내가 이미 누른 반응. RLS 가 자기 것만 돌려준다. */
export async function getMyReactions(
  postIds: string[],
): Promise<Map<string, Set<ReactionType>>> {
  const result = new Map<string, Set<ReactionType>>();
  if (postIds.length === 0) return result;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reactions")
    .select("post_id, reaction_type")
    .in("post_id", postIds);

  if (error) {
    console.error("[community] 내 반응 조회 실패", { code: error.code });
    return result;
  }

  for (const row of data ?? []) {
    const set = result.get(row.post_id) ?? new Set<ReactionType>();
    set.add(row.reaction_type as ReactionType);
    result.set(row.post_id, set);
  }
  return result;
}
