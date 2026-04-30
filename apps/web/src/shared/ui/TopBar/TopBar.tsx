import { ReactNode } from "react";
import styles from "./TopBar.module.css";

interface TopBarProps {
  onBack?: () => void;
  title?: string;
  right?: ReactNode;
}

export function TopBar({ onBack, title, right }: TopBarProps) {
  return (
    <header className={styles.topbar}>
      <div className={styles.topbar__left}>
        {onBack && (
          <button className={styles.topbar__back} onClick={onBack} aria-label="Back">
            ‹
          </button>
        )}
      </div>

      {title && <span className={styles.topbar__title}>{title}</span>}

      <div className={styles.topbar__right}>{right ?? null}</div>
    </header>
  );
}
