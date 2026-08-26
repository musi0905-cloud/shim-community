import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import styles from "./PrimaryButton.module.css";

interface ButtonLinkProps {
  href: Route;
  children: ReactNode;
  variant?: "solid" | "quiet";
  fullWidth?: boolean;
}

/**
 * 버튼처럼 보이는 링크.
 *
 * <a> 안에 <button> 을 넣지 않는다. button 은 interactive content 라
 * 링크 안에 들어갈 수 없고(HTML 사양 위반), 실제로도 <a> 의 박스가
 * 글자 높이로 접혀 클릭 영역이 버튼보다 작아진다.
 *
 * 스타일은 PrimaryButton 과 같은 파일을 공유해 둘이 어긋나지 않게 한다.
 */
export function ButtonLink({
  href,
  children,
  variant = "solid",
  fullWidth = false,
}: ButtonLinkProps) {
  const classes = [
    styles.button,
    styles.asLink,
    variant === "quiet" ? styles.quiet : null,
    fullWidth ? styles.fullWidth : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
