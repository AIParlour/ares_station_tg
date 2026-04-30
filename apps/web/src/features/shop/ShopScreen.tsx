import { TopBar } from "../../shared/ui/TopBar/TopBar";
import { Classification } from "../../shared/ui/Classification/Classification";
import { useRouter } from "../../app/Router";
import styles from "./ShopScreen.module.css";

const ITEMS = [
  { id: "hint-1", label: "SIGNAL BOOST", sub: "Reveal one letter of a puzzle answer", price: "15 ⬡" },
  { id: "hint-2", label: "FULL DECRYPT",  sub: "Reveal complete answer for one puzzle",  price: "50 ⬡" },
  { id: "hint-3", label: "PARADOX UNLOCK", sub: "Unlock restricted Paradox memory block", price: "80 ⬡" },
];

export function ShopScreen() {
  const { goBack } = useRouter();

  return (
    <div className={styles.shop}>
      <Classification level="premium" label="STATION STORE // DECRYPTION AIDS" />
      <TopBar onBack={goBack} title="STATION STORE" />

      <div className={styles.shop__balance}>
        BALANCE: <span className={styles.shop__balance__value}>0 ⬡</span>
      </div>

      <div className={styles.shop__items}>
        {ITEMS.map((item) => (
          <div key={item.id} className={styles.shop__item}>
            <div className={styles.shop__item__info}>
              <div className={styles.shop__item__label}>{item.label}</div>
              <div className={styles.shop__item__sub}>{item.sub}</div>
            </div>
            <button className={styles.shop__item__btn} disabled>
              {item.price}
            </button>
          </div>
        ))}
      </div>

      <div className={styles.shop__coming}>
        PAYMENT INTEGRATION COMING SOON
      </div>
    </div>
  );
}
