import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/AuthShell";
import { ButtonLink } from "@/components/ui/ButtonLink";

export const metadata: Metadata = { title: "링크를 열 수 없어요" };

const REASON_MESSAGE: Record<string, string> = {
  expired: "링크가 만료되었거나 이미 사용되었어요. 다시 받으면 됩니다.",
  invalid: "링크가 올바르지 않아요. 메일의 링크를 다시 눌러주세요.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const message =
    (reason && REASON_MESSAGE[reason]) ??
    "로그인을 마치지 못했어요. 다시 시도해주세요.";

  return (
    <AuthShell title="링크를 열 수 없어요" description={message}>
      <ButtonLink href="/auth" fullWidth>
        로그인 링크 다시 받기
      </ButtonLink>
    </AuthShell>
  );
}
