import styles from "./Classification.module.css";

type ClassificationLevel = "standard" | "artifact" | "red-alert" | "premium";

interface ClassificationProps {
  level: ClassificationLevel;
  label?: string;
}

const LABELS: Record<ClassificationLevel, string> = {
  "standard":   "ARES STATION // DOCUMENT SYSTEM",
  "artifact":   "ARTIFACT // RESTRICTED ACCESS",
  "red-alert":  "RED ALERT // CLEARANCE REQUIRED",
  "premium":    "HELIOS COGNITIVE SYSTEMS // INTERNAL",
};

export function Classification({ level, label }: ClassificationProps) {
  return (
    <div className={`${styles.classification} ${styles[`classification--${level}`]}`}>
      {label ?? LABELS[level]}
    </div>
  );
}
