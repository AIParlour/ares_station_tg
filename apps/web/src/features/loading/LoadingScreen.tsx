import { useEffect } from "react";
import { useRouter } from "../../app/Router";
import { useTelegramAuth } from "../../shared/hooks/useTelegramAuth";
import styles from "./LoadingScreen.module.css";

export function LoadingScreen() {
  const auth = useTelegramAuth();
  const { replace } = useRouter();

  useEffect(() => {
    if (auth.status === "ok") {
      replace({ name: "home" });
    }
    // error stays on loading screen — show message below
  }, [auth.status, replace]);

  return (
    <div className={styles.loading}>
      <div className={styles.loading__logo}>ARES STATION</div>
      <div className={styles.loading__sub}>MARS RESEARCH COLLECTIVE</div>

      <div className={styles.loading__status}>
        {auth.status === "error" ? (
          <span className={styles["loading__status--error"]}>
            AUTH FAILURE — {auth.message}
          </span>
        ) : (
          <span className={styles["loading__status--pending"]}>
            AUTHENTICATING…
          </span>
        )}
      </div>

      <div className={styles.loading__bar}>
        <div className={styles.loading__fill} />
      </div>

      <div className={styles.loading__footer}>
        SOL 2187 // HELIOS COGNITIVE SYSTEMS ONLINE
      </div>
    </div>
  );
}
