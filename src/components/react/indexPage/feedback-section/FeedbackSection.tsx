import React from "react";
import styles from "./styles.module.css";

interface AgileverseFeedbackElement extends HTMLElement {
  key: string;
}

type AgileverseFeedbackAttributes = React.DetailedHTMLProps<React.HTMLAttributes<AgileverseFeedbackElement>, AgileverseFeedbackElement> & {
  theme?: string;
  title?: string;
  "rate-description"?: string;
  "description-placeholder"?: string;
  "description-label"?: string;
  "description-message"?: string;
  "submit-button-text"?: string;
  "thanks-cta-text"?: string;
  "thanks-title"?: string;
  "thanks-subtitle"?: string;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "agileverse-feedback": AgileverseFeedbackAttributes;
    }
  }
}

function FeedbackSection() {
  React.useEffect(() => {
    import("agileverse-feedback").then(() => {
      const feedbackForm = document.querySelector<AgileverseFeedbackElement>("agileverse-feedback");
      if (feedbackForm) {
        feedbackForm.key = "a45dc156a66f344f8e4e9c2649da2785";
      }
    });
  }, []);

  return (
    <section className={styles.feedbackSectionWrapper}>
      <div className={styles.feedbackGrid}>
        <div className={styles.contentWrapper}>
          <h2 className={styles.title}>Feedback</h2>
          <article className={styles.descWrapper}>
            <p className={styles.desc}>feedback is essential for each person who want to make progress and become better each day</p>
            <p className={styles.desc}>
              by giving me a Feedback you help me to see my life and decisions from your perspective so more feedback from different peoples would let me see myself in a 360° view
            </p>
            <p className={styles.desc}>so i would be really glad if you give me a feedback and help me to become a better person :)</p>
          </article>
        </div>
        <div className={styles.formWrapper}>
          <agileverse-feedback
            theme="light"
            title="Feedback Form"
            rate-description="Which Emoji Would Express You're Feeling About Me Better?"
            description-placeholder="like: how could I be a better person in your opinion"
            description-label="any suggestion"
            description-message="it's anonymous so feel free to open up"
            submit-button-text="submit your feedback"
            thanks-cta-text="create your own feedback form"
            thanks-title="thank you 😻"
            thanks-subtitle=""
          ></agileverse-feedback>
        </div>
      </div>
    </section>
  );
}

export default FeedbackSection;
