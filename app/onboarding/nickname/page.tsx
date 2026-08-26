import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/layout/AuthShell";
import { NicknameForm } from "@/components/auth/NicknameForm";
import { getCurrentProfile, requireUser } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "이름 정하기" };

export default async function NicknamePage() {
  // 로그인하지 않았으면 /auth 로 보낸다.
  await requireUser();

  // 이미 이름이 있으면 다시 정하는 화면이 아니다.
  const profile = await getCurrentProfile();
  if (profile) redirect("/");

  return (
    <AuthShell
      title="어떤 이름으로 부를까요?"
      description="쉼 안에서 계속 사용할 이름을 골라주세요. 현실의 이름을 적지 않아도 괜찮아요."
    >
      <NicknameForm />
    </AuthShell>
  );
}
