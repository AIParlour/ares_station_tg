import { useGame } from "../GameProvider";
import { useRouter } from "../../../app/Router";
import { TopBar } from "../../../shared/ui/TopBar/TopBar";
import { Classification } from "../../../shared/ui/Classification/Classification";
import { haptic } from "../../../shared/hooks/useTelegram";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import styles from "./StoryScreen.module.css";

/** Raw document line from the day JSON. Supports text + optional inline redaction. */
interface RawDocLine {
  text: string;
  redact?: { slot: string; placeholder: string; reveal: string };
  rest?: string;
}

export function StoryScreen() {
  const { state, completeDay } = useGame();
  const { current, replace } = useRouter();
  const readOnly = current.params?.readOnly === true;

  if (state.status !== "ready" || !state.day) {
    return (
      <div className={styles.story}>
        <TopBar onBack={() => replace({ name: "home" })} title="LOG" />
        <div className={styles.story__empty}>NO LOG DATA AVAILABLE.</div>
      </div>
    );
  }

  const { day } = state;

  const handleComplete = () => {
    haptic("notification", "success");
    completeDay();
    replace({ name: "home" });
  };

  return (
    <div className={styles.story}>
      <Classification level="standard" label={`ARES STATION // SOL ${day.stardate}`} />
      <TopBar onBack={() => replace({ name: "document" })} title={`${day.author.full}`} />

      <div className={styles.story__header}>
        <div className={styles.story__title}>{day.title}</div>
        <div className={styles.story__meta}>
          SOL {day.stardate} — PERSONAL LOG — {day.author.short}
        </div>
      </div>

      <div className={styles.story__body}>
        {(day.document as RawDocLine[]).map((line, i) => (
          <StoryLine key={i} line={line} />
        ))}
      </div>

      {!readOnly && (
        <div className={styles.story__complete}>
          <button
            className={styles.story__complete__btn}
            onClick={handleComplete}
          >
            <span className={styles.story__complete__icon}><FontAwesomeIcon icon={faFloppyDisk} /></span>
            <span>LOG ARCHIVED — COMPLETE DAY</span>
          </button>
          <div className={styles.story__complete__hint}>
            This log will be saved to your collected documents.
          </div>
        </div>
      )}

      <div className={styles.story__footer}>
        END OF LOG — SOL {day.stardate}
      </div>
    </div>
  );
}

function StoryLine({ line }: { line: RawDocLine }) {
  if (!line.text && !line.redact) {
    return <div className={styles.story__break} />;
  }

  if (line.redact) {
    return (
      <p className={styles.story__line}>
        {line.text}{line.redact.reveal}{line.rest ?? ""}
      </p>
    );
  }
  return <p className={styles.story__line}>{line.text}</p>;
}
