import type { InputHTMLAttributes } from "react";
import styles from "./TextField.module.css";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  /** 입력 아래 안내 문구. */
  hint?: string;
  /** 값이 있으면 오류 상태로 표시한다. */
  errorMessage?: string;
}

/** 텍스트 입력 하나. 오류는 색 외에 테두리와 문구로도 알린다. */
export function TextField({
  id,
  label,
  hint,
  errorMessage,
  className,
  ...rest
}: TextFieldProps) {
  const invalid = Boolean(errorMessage);
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = invalid ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={[styles.input, invalid ? styles.invalid : null, className]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {invalid ? (
        <p id={errorId} className={styles.message} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
