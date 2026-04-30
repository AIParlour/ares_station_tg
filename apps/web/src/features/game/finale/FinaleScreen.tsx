import { useState, useRef } from "react";
import { useGame } from "../GameProvider";
import { useRouter } from "../../../app/Router";
import { TopBar } from "../../../shared/ui/TopBar/TopBar";
import { Classification } from "../../../shared/ui/Classification/Classification";
import { haptic } from "../../../shared/hooks/useTelegram";
import { askParadox, resetParadox } from "../../../shared/api/paradox";
import styles from "./FinaleScreen.module.css";

interface Message {
  role: "user" | "paradox";
  text: string;
}

export function FinaleScreen() {
  const { state } = useGame();
  const { goBack } = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "paradox",
      text: "PARADOX ONLINE. I have been expecting this session. You may proceed with your questions. Note: all communications are logged per Helios Directive 7-C.",
    },
  ]);
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  if (!state.day) {
    return (
      <div className={styles.finale}>
        <TopBar onBack={goBack} title="PARADOX" />
        <div className={styles.finale__loading}>INITIALISING…</div>
      </div>
    );
  }

  const { day } = state;

  const send = async () => {
    const text = prompt.trim();
    if (!text || sending) return;

    setPrompt("");
    setSending(true);
    haptic("impact", "light");

    const userMsg: Message = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await askParadox(day.dayId, text, state.unlockedWords);
      setMessages((prev) => [...prev, { role: "paradox", text: res.reply }]);
      haptic("notification", "success");
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "paradox", text: "COMMUNICATION INTERRUPTED. PLEASE RETRY." },
      ]);
    } finally {
      setSending(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  };

  const reset = async () => {
    haptic("impact", "medium");
    await resetParadox(day.dayId).catch(() => null);
    setMessages([
      {
        role: "paradox",
        text: "SESSION RESET. Previous context has been archived per Helios Directive 4-A. You may proceed.",
      },
    ]);
  };

  return (
    <div className={styles.finale}>
      <Classification level="artifact" label="PARADOX INTERROGATION // SESSION ACTIVE" />
      <TopBar
        onBack={goBack}
        title="PARADOX v4.1"
        right={
          <button className={styles.finale__reset} onClick={reset} title="Reset session">
            ↺
          </button>
        }
      />

      <div className={styles.finale__unlock}>
        {state.unlockedWords.length > 0 ? (
          <>
            <span className={styles.finale__unlock__label}>UNLOCK WORDS: </span>
            {state.unlockedWords.map((w) => (
              <span key={w} className={styles.finale__unlock__word}>{w}</span>
            ))}
          </>
        ) : (
          <span className={styles.finale__unlock__label}>NO UNLOCK WORDS — SOLVE PUZZLES FIRST</span>
        )}
      </div>

      <div className={styles.finale__thread}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`${styles.finale__bubble} ${
              msg.role === "user"
                ? styles["finale__bubble--user"]
                : styles["finale__bubble--paradox"]
            }`}
          >
            {msg.role === "paradox" && (
              <span className={styles.finale__bubble__label}>PARADOX</span>
            )}
            <p className={styles.finale__bubble__text}>{msg.text}</p>
          </div>
        ))}
        {sending && (
          <div className={`${styles.finale__bubble} ${styles["finale__bubble--paradox"]}`}>
            <span className={styles.finale__bubble__label}>PARADOX</span>
            <p className={`${styles.finale__bubble__text} ${styles["finale__bubble__text--typing"]}`}>
              ▋
            </p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className={styles.finale__input__group}>
        <input
          className={styles.finale__input}
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="ASK PARADOX…"
          disabled={sending}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <button
          className={styles.finale__send}
          onClick={send}
          disabled={sending || !prompt.trim()}
        >
          ▶
        </button>
      </div>
    </div>
  );
}
