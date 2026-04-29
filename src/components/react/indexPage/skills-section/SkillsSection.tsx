import BackendSkillItems from './BackendSkillItems'
import { SkillsBackground } from './background/SkillsBackground'
import FrontendSkillItems from './FrontendSkillItems'
import { useBulletPoints, useHalfCirclePath, useSyncSize } from './hooks'
import NonTechnicalSkills from './NonTechnicalSkills'
import styles from './styles.module.css'

function SkillsSection() {
  const { contentHeightShare, sphereGapPercent, variableStyle } = useSyncSize();
  const halfCirclePath = useHalfCirclePath();
  const bullets = useBulletPoints();
  return (
    <section className={styles.skillsSectionWrapper} style={variableStyle}>
      <div className={styles.skillsBackgroundWrapper}>
        <SkillsBackground sphereFillPercent={contentHeightShare - sphereGapPercent}></SkillsBackground>
      </div>
      <div className={styles.skillsContentWrapper} >
        <div className={styles.skillsContent} style={{ height: `${contentHeightShare}%` }}>
          <h2 className={styles.title}><span>Skills</span></h2>
          <svg className={styles.dividerSVG} viewBox='0 0 265 120'>
            <title>divider shape</title>
            <path d={halfCirclePath} fill="none" filter="url(#softShadow)"/>
            <g className={styles.skillsGroup}>
              <g transform={`translate(${bullets.ui.x}, ${bullets.ui.y})`} className={styles.skillGroup}>
                <circle cx="0" cy="0" r="1" className={styles.bullet}></circle>
                <text className={`${styles.skillGroupTitle}`} data-size="sm">UI/UX Designer</text>
                <text className={`${styles.skillGroupDescription}`} data-size="sm"> Broad Understanding UI/UX Principles & Like to Create a Creative One</text>
              </g>
              <g transform={`translate(${bullets.backend.x}, ${bullets.backend.y})`} className={styles.skillGroup}>
                <circle cx="0" cy="0" r="2" className={styles.bullet}></circle>
                <text className={`${styles.skillGroupTitle}`} data-size="md">Back-end Developer</text>
                <text className={`${styles.skillGroupDescription}`} data-size="md">Good proficiency for Small/Mid Projects in NodeJS,Rust,C#</text>
              </g>
              <g transform={`translate(${bullets.frontend.x}, ${bullets.frontend.y})`} className={styles.skillGroup}>
                <circle cx="0" cy="0" r="4" className={styles.bullet}></circle>
                <text className={`${styles.skillGroupTitle}`} >Front-end Developer</text>
                <text className={`${styles.skillGroupDescription}`} >Expert in Front-end Development, React, Web component,...</text>
              </g>
              <g transform={`translate(${bullets.agile.x}, ${bullets.agile.y})`} className={styles.skillGroup}>
                <circle cx="0" cy="0" r="2" className={styles.bullet}></circle>
                <text className={`${styles.skillGroupTitle}`} data-size="md">Agile & Management</text>
                <text className={`${styles.skillGroupDescription}`} data-size="md">Foundational Understanding of Agile Methodologies an Human Behaviors</text>÷
              </g>
              <g transform={`translate(${bullets.product.x}, ${bullets.product.y})`} className={styles.skillGroup}>
                <circle cx="0" cy="0" r="1" className={styles.bullet}></circle>
                <text className={`${styles.skillGroupTitle}`} data-size="sm">Product & Soft Skills</text>
                <text className={`${styles.skillGroupDescription}`} data-size="sm">Able to Understand User Needs & balance Cost/Quality</text>
              </g>
            </g>
            <defs>
              <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur" />
                <feOffset in="blur" dx="0" dy="4" result="offset" />
                <feFlood flood-color="var(--p-color)" flood-opacity="0.25" result="color" />
                <feComposite in="color" in2="offset" operator="in" result="shadow" />
                <feMerge>
                  <feMergeNode in="shadow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </svg>
        </div>

      </div>

    </section>
  )
}

export default SkillsSection