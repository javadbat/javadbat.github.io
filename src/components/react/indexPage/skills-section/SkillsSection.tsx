import BackendSkillItems from './BackendSkillItems'
import { SkillsBackground } from './background/SkillsBackground'
import FrontendSkillItems from './FrontendSkillItems'
import NonTechnicalSkills from './NonTechnicalSkills'
import styles from './styles.module.css'

function SkillsSection() {
  return (
    <section className={styles.skillsSectionWrapper}>
      <div className={styles.skillsBackgroundWrapper}>
        <SkillsBackground></SkillsBackground>
      </div>
      <div className={styles.skillsContent}>
        <h2 className={styles.title}>Skills</h2>
        <div className={styles.skillGroups}>
          <div className={styles.skillGroup}>
            <div className={styles.skillGroupTitle}>Back-end</div>
            <div className={styles.skillItems}>
              <BackendSkillItems></BackendSkillItems>
            </div>
          </div>
          <div className={styles.skillGroup}>
            <div className={styles.skillGroupTitle}>Front-end</div>
            <div className={styles.skillItems}>
              <FrontendSkillItems></FrontendSkillItems>
            </div>
          </div>
          <div className={styles.skillGroup}>
            <div className={styles.skillGroupTitle}>Non-Technical</div>
            <div className={styles.skillItems}>
              <NonTechnicalSkills></NonTechnicalSkills>
            </div>
          </div>
        </div>
      </div>

    </section>
  )
}

export default SkillsSection