/* ─────────────────────────────────────────────────────────────────────────────
   DocumentsScreen — Collected documents archive.

   Lists all completed day stories. Tapping a day navigates to the story
   screen for re-reading (the story route reads from GameProvider state,
   so the current day must match — for now we show the list and allow
   re-reading only the current day; future: fetch any completed day).
   ───────────────────────────────────────────────────────────────────────────── */

import { TopBar } from "../../shared/ui/TopBar/TopBar";
import { Classification } from "../../shared/ui/Classification/Classification";
import { useRouter } from "../../app/Router";
import { useGame } from "../game/GameProvider";
import { haptic } from "../../shared/hooks/useTelegram";
import type { CompletedDay } from "../game/GameProvider";
import styles from "./DocumentsScreen.module.css";

export function DocumentsScreen() {
  const { goBack, navigate } = useRouter();
  const { state } = useGame();
  const { completedDays } = state;

  const handleOpenDay = (entry: CompletedDay) => {
    // Can only re-read the currently loaded day
    if (state.day && state.day.dayId === entry.dayId) {
      haptic("impact", "light");
      navigate({ name: "story", params: { readOnly: true } });
    }
  };

  return (
    <div className={styles.documents}>
      <Classification level="standard" />
      <TopBar onBack={goBack} title="EVIDENCE ARCHIVE" />

      {completedDays.length === 0 ? (
        <div className={styles.documents__empty}>
          <div className={styles.documents__empty__icon}>◈</div>
          <div className={styles.documents__empty__title}>NO DOCUMENTS COLLECTED</div>
          <div className={styles.documents__empty__sub}>
            Complete daily investigations to unlock personal logs from Dr. Leskov.
          </div>
        </div>
      ) : (
        <div className={styles.documents__list}>
          <div className={styles.documents__list__header}>
            ARCHIVED MISSION LOGS — {completedDays.length}
          </div>

          {completedDays.map((entry) => {
            const isCurrent = state.day?.dayId === entry.dayId;
            return (
              <button
                key={entry.dayId}
                className={`${styles.documents__item} ${isCurrent ? styles["documents__item--active"] : styles["documents__item--locked"]}`}
                onClick={() => handleOpenDay(entry)}
                disabled={!isCurrent}
              >
                <div className={styles.documents__item__sol}>
                  SOL {entry.stardate}
                </div>
                <div className={styles.documents__item__title}>
                  {entry.title}
                </div>
                <div className={styles.documents__item__author}>
                  {entry.author.full}
                </div>
                <div className={styles.documents__item__status}>
                  {isCurrent ? "TAP TO READ" : "ARCHIVED"}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
