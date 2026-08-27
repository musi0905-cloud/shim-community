/**
 * Community Feed 커서.
 *
 * "몇 번째부터"(offset)가 아니라 "이 글 다음부터"로 넘긴다. offset 은 페이지를
 * 넘기는 사이에 글이 하나 들어오면 전체가 한 칸씩 밀려, 앞 페이지의 마지막
 * 글이 다음 페이지에 다시 나온다. 글이 지워지면 반대로 한 건이 건너뛰어진다.
 * (QA-265)
 *
 * 정렬 키가 두 개인 이유: created_at 만으로는 같은 시각에 올라온 글들의
 * 순서가 정해지지 않아 커서가 가리키는 지점이 흔들린다. post_id 를 두 번째
 * 키로 넣어야 순서가 결정적이 된다.
 *
 * 커서는 URL 에 그대로 실린다. 사용자가 바꿔 넣을 수 있는 값이므로 되돌릴 때
 * 형식을 반드시 확인하고, 이상하면 첫 페이지로 돌아간다.
 */

export interface FeedCursor {
  /** ISO 8601 timestamptz. */
  createdAt: string;
  postId: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** URL 한 칸에 담기 좋게 묶는다. 비밀이 아니라 그냥 짧게 만드는 용도다. */
export function encodeFeedCursor(cursor: FeedCursor): string {
  return Buffer.from(`${cursor.createdAt}|${cursor.postId}`, "utf8").toString(
    "base64url",
  );
}

/** 형식이 맞지 않으면 null. 호출부는 null 을 "첫 페이지"로 다룬다. */
export function decodeFeedCursor(raw: string | undefined | null): FeedCursor | null {
  if (!raw) return null;

  let decoded: string;
  try {
    decoded = Buffer.from(raw, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const separator = decoded.lastIndexOf("|");
  if (separator <= 0) return null;

  const createdAt = decoded.slice(0, separator);
  const postId = decoded.slice(separator + 1);

  if (!UUID_RE.test(postId)) return null;
  if (Number.isNaN(Date.parse(createdAt))) return null;

  return { createdAt, postId };
}
