"use client";

import { useEffect } from "react";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import styles from "./error.module.css";

/**
 * 예상하지 못한 오류 화면.
 *
 * 사용자에게는 원인을 설명하지 않는다. 지친 상태로 들어온 사람에게
 * 기술적인 문구를 읽히지 않는다. 원인 추적은 서버 로그와 아래 console.error
 * 로 남긴다.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error-boundary]", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className={styles.wrap}>
      <div className={styles.panel}>
        <h1 className={styles.title}>잠시 문제가 있었어요</h1>
        <p className={styles.body}>
          잠깐 뒤에 다시 시도해주세요. 계속 안 되면 잠시 쉬었다 와도 괜찮아요.
        </p>
        <PrimaryButton onClick={reset}>다시 시도</PrimaryButton>
      </div>
    </div>
  );
}
