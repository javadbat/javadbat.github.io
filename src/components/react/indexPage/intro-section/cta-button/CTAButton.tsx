import type { PropsWithChildren } from "react";
import styles from './CTAButton.module.css';

export function CTAButton(props: PropsWithChildren<{}>) {
  return (
    <a className={styles.buttonWrapper} href="https://www.linkedin.com/in/javad-bathaei/" target="_blank">
      <button className={styles.button}>
        {props.children}
        <span className={styles.dropShadow}></span>
      </button>
    </a>
  )
}

