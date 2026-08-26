import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/layout/AuthShell";
import { AuthForm } from "@/components/auth/AuthForm";
import { getCurrentUser } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "로그인" };

export default async function AuthPage() {
  // 이미 로그인한 사람에게 로그인 화면을 다시 보여주지 않는다.
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <AuthShell
      title="다시 이어서"
      description="다시 돌아왔을 때도 같은 이름으로 이어갈 수 있도록 간단한 로그인이 필요해요."
    >
      <AuthForm />
    </AuthShell>
  );
}
