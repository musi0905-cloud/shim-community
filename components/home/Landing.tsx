import { APP_SHORT_NAME } from "@/lib/constants";
import { ButtonLink } from "@/components/ui/ButtonLink";
import styles from "./Landing.module.css";

/**
 * 비로그인 첫 화면.
 * 서비스를 길게 설명하지 않는다. 지친 사람에게 읽을거리를 더 주지 않는다.
 */
export function Landing() {
  return (
    <div className={styles.landing}>
      <div className={styles.panel}>
        <span className={styles.mark} aria-hidden="true">
          {APP_SHORT_NAME}
        </span>

        <div className={styles.copy}>
          <h1 className={styles.title}>오늘의 마음을 잠깐 내려놓는 곳.</h1>
          <p className={styles.description}>
            힘든 순간, 잠시 현실에서 거리를 두고 나에게 돌아올 수 있는 시간을
            만들어요. 오래 머무는 곳이 아니에요.
          </p>
        </div>

        <div className={styles.actions}>
          <ButtonLink href="/auth" fullWidth>
            시작하기
          </ButtonLink>
          <p className={styles.note}>
            이메일만 있으면 돼요. 현실의 이름은 묻지 않아요.
          </p>
        </div>
      </div>
    </div>
  );
}
