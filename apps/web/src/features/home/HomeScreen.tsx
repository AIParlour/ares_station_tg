import { useEffect } from "react";
import { Classification } from "../../shared/ui/Classification/Classification";
import { useRouter } from "../../app/Router";
import { useGame } from "../game/GameProvider";
import { haptic } from "../../shared/hooks/useTelegram";
import styles from "./HomeScreen.module.css";

export function HomeScreen() {
  const { navigate } = useRouter();
  const { state, reload } = useGame();

  // Load day data on first render — auth is guaranteed complete by this point
  // because LoadingScreen gates navigation to home until the JWT is stored
  useEffect(() => {
    if (state.status === "idle") {
      reload();
    }
  }, [state.status, reload]);

  const handleStart = () => {
    haptic("impact", "light");
    navigate({ name: "document" });
  };

  const handleDocuments = () => {
    haptic("selection");
    navigate({ name: "documents" });
  };

  const handleShop = () => {
    haptic("selection");
    navigate({ name: "shop" });
  };

  const handleMap = () => {
    haptic("selection");
    navigate({ name: "map" });
  };

  return (
    <div className={styles.home}>
      <Classification level="standard" />

      <div className={styles.home__header}>
        <div className={styles.home__title}>ARES STATION</div>
        <div className={styles.home__subtitle}>INCIDENT INVESTIGATION TERMINAL</div>
        <div className={styles.home__sol}>SOL 2187</div>
      </div>

      <div className={styles.home__divider} />

      <div className={styles.home__briefing}>
        <p className={styles.home__briefing__line}>
          CREW STATUS: <span className={styles["home__briefing__value--critical"]}>20 DECEASED</span>
        </p>
        <p className={styles.home__briefing__line}>
          CAUSE: <span className={styles["home__briefing__value--unknown"]}>UNDER INVESTIGATION</span>
        </p>
        <p className={styles.home__briefing__line}>
          PARADOX ACCESS: <span className={styles["home__briefing__value--active"]}>ONLINE</span>
        </p>
      </div>

      <div className={styles.home__divider} />

      <nav className={styles.home__menu}>
        <button
          className={`${styles.home__menu__btn} ${styles["home__menu__btn--primary"]}`}
          onClick={handleStart}
        >
          <span className={styles.home__menu__icon}>▶</span>
          <span className={styles.home__menu__label}>BEGIN INVESTIGATION</span>
          <span className={styles.home__menu__sub}>DECRYPT · INTERROGATE · UNCOVER</span>
        </button>

        <button className={styles.home__menu__btn} onClick={handleMap}>
          <span className={styles.home__menu__icon}>◉</span>
          <span className={styles.home__menu__label}>STATION MAP</span>
          <span className={styles.home__menu__sub}>SECTOR SCHEMATIC · LOCK STATUS</span>
        </button>

        <button className={styles.home__menu__btn} onClick={handleDocuments}>
          <span className={styles.home__menu__icon}>📁</span>
          <span className={styles.home__menu__label}>COLLECTED DOCUMENTS</span>
          <span className={styles.home__menu__sub}>EVIDENCE ARCHIVE</span>
        </button>

        <button className={styles.home__menu__btn} onClick={handleShop}>
          <span className={styles.home__menu__icon}>◈</span>
          <span className={styles.home__menu__label}>STATION STORE</span>
          <span className={styles.home__menu__sub}>HINTS · DECRYPTION AIDS</span>
        </button>
      </nav>

      <div className={styles.home__footer}>
        HELIOS COGNITIVE SYSTEMS — PARADOX v4.1 // ALL COMMUNICATIONS LOGGED
      </div>
    </div>
  );
}
