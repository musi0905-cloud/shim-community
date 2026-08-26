import {
  BRAND_DESCRIPTION,
  BRAND_MESSAGE,
  BRAND_NAME,
  BRAND_SUBTITLE,
} from "@/lib/constants";
import { ButtonLink } from "@/components/ui/ButtonLink";
import styles from "./Landing.module.css";

/**
 * 비로그인 첫 화면.
 *
 * 여기가 브랜드 화면이다. 이름과 부제를 두 줄 계층으로 놓고, 브랜드 메시지
 * ("도파민보다, 쉼.")는 이 화면에서만 쓴다. 앱 안쪽 화면마다 반복하지 않는다.
 *
 * 서비스를 길게 설명하지 않는다. 지친 사람에게 읽을거리를 더 주지 않는다.
 */
export function Landing() {
  return (
    <div className={styles.landing}>
      <div className={styles.panel}>
        {/*
          워드마크가 크게 들어가므로 원형 마크를 따로 두지 않는다.
          같은 글자를 두 번 보여주게 된다.
          h1 은 브랜드 이름 하나. 부제는 붙이지 않고 아랫줄에 둔다.
        */}
        <div className={styles.brand}>
          <h1 className={styles.brandName}>{BRAND_NAME}</h1>
          <p className={styles.brandSubtitle}>{BRAND_SUBTITLE}</p>
        </div>

        <p className={styles.message}>{BRAND_MESSAGE}</p>

        <div className={styles.copy}>
          <p className={styles.description}>{BRAND_DESCRIPTION}</p>
          <p className={styles.sub}>
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
