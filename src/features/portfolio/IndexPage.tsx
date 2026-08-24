import { fixMobileHeightVH } from "../../utils/helpers/layout-helper";
import ExperiencesSection from "./experiences-section/ExperiencesSection";
import FeedbackSection from "./feedback-section/FeedbackSection";
import IntroSection from "./intro-section/IntroSection";
import SkillsSection from "./skills-section/SkillsSection";
import { useEffect } from "react";
import styles from "./styles.module.css";

export function IndexPage() {
  useEffect(() => {
    fixMobileHeightVH();
  }, []);
  return (
    <main className={styles.mainSectionsWrapper}>
      <IntroSection></IntroSection>
      <SkillsSection ></SkillsSection>
      <ExperiencesSection></ExperiencesSection>
      <FeedbackSection></FeedbackSection>
    </main>
  );
}
