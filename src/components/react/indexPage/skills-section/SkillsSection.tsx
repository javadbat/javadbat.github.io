import { useMediaQuery } from 'usehooks-ts'
import BackendSkillItems from './contents/BackendSkillItems'
import { SkillsBackground } from './background/SkillsBackground'
import FrontendSkillItems from './contents/FrontendSkillItems'
import { useBulletPoints, useHalfCirclePath, useSyncSize } from './hooks'
import AgileContent from './contents/AgileContent'
import styles from './styles.module.css'
import { Activity, useState } from 'react'
import ProductContent from './contents/ProductContent'
import { ClientJBModal } from '../../components/modal/ClientJBModal'
import UiContent from './contents/UiContent'

function SkillsSection() {
  const { contentHeightShare, sphereGapPercent, variableStyle } = useSyncSize();
  const halfCirclePath = useHalfCirclePath();
  const bullets = useBulletPoints();
  const matches = useMediaQuery('(max-aspect-ratio: 1/1)');
  const [modalContent, setModalContent] = useState<"product"|"agile"|"front"|"backend"|"ui"|null>(null)
  return (
    <section className={styles.skillsSectionWrapper} style={variableStyle}>
      <div className={styles.skillsBackgroundWrapper}>
        <SkillsBackground sphereFillPercent={contentHeightShare - sphereGapPercent}></SkillsBackground>
      </div>
      <div className={styles.skillsContentWrapper} >
        <div className={styles.skillsContent} style={{ height: `${contentHeightShare}%` }}>
          <h2 className={styles.title}><span>Skills</span></h2>
          <svg className={styles.dividerSVG} viewBox='0 0 265 120'>
            <title>Skills</title>
            <path d={halfCirclePath} fill="none" filter="url(#softShadow)" />
            <g className={styles.skillsGroup}>
              <g transform={`translate(${bullets.ui.x}, ${bullets.ui.y})`} className={styles.skillGroup} onClick={()=>setModalContent("ui")}>
                <circle cx="0" cy="0" r="1" className={styles.bullet}></circle>
                <text className={`${styles.skillGroupTitle}`} data-size="sm">UI/UX Designer</text>
                <text className={`${styles.skillGroupDescription}`} data-size="sm"> Broad Understanding UI/UX Principles & Like to Create a Creative One</text>
              </g>
              <g transform={`translate(${bullets.backend.x}, ${bullets.backend.y})`} className={styles.skillGroup} onClick={()=>setModalContent("backend")}>
                <circle cx="0" cy="0" r="2" className={styles.bullet}></circle>
                <text className={`${styles.skillGroupTitle}`} data-size="md">Back-end Developer</text>
                {
                  !matches ?
                    <text className={`${styles.skillGroupDescription}`} data-size="md">Good proficiency for Small/Mid Projects in NodeJS,Rust,C#</text> :
                    <text className={`${styles.skillGroupDescription}`} data-size="md">
                      Good proficiency for Small/Mid Projects in
                      <tspan x="0" dy="6">NodeJS,Rust,C#</tspan>
                    </text>
                }
              </g>
              <g transform={`translate(${bullets.frontend.x}, ${bullets.frontend.y})`} className={styles.skillGroup} onClick={()=>setModalContent("front")}>
                <circle cx="0" cy="0" r="4" className={styles.bullet}></circle>
                <text className={`${styles.skillGroupTitle}`} >Front-end Developer</text>
                {
                  !matches &&
                  <text className={`${styles.skillGroupDescription}`} >Expert in Front-end Development, React, Web component,...</text>
                }
                {
                  matches &&
                  <text className={`${styles.skillGroupDescription}`} >
                    Expert in Front-end Development
                    <tspan x="0" dy="6">React, Web component,...</tspan>
                  </text>
                }
              </g>
              <g transform={`translate(${bullets.agile.x}, ${bullets.agile.y})`} className={styles.skillGroup} onClick={()=>setModalContent("agile")}>
                <circle cx="0" cy="0" r="2" className={styles.bullet}></circle>
                <text className={`${styles.skillGroupTitle}`} data-size="md">Agile & Management</text>
                {
                  !matches?
                  <text className={`${styles.skillGroupDescription}`} data-size="md">Foundational Understanding of Agile Methodologies an Human Behaviors</text>:
                  <text className={`${styles.skillGroupDescription}`} data-size="md">
                    Foundational Understanding of Agile Methodologies
                    <tspan x="0" dy="6">an Human Behaviors</tspan>
                  </text>
                }
                </g>
              <g transform={`translate(${bullets.product.x}, ${bullets.product.y})`} className={styles.skillGroup} onClick={()=>setModalContent("product")}>
                <circle cx="0" cy="0" r="1" className={styles.bullet}></circle>
                <text className={`${styles.skillGroupTitle}`} data-size="sm">Product & Soft Skills</text>
                <text className={`${styles.skillGroupDescription}`} data-size="sm">Able to Understand User Needs & balance Cost/Quality</text>
              </g>
            </g>
            <defs>
              <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur" />
                <feOffset in="blur" dx="0" dy="4" result="offset" />
                <feFlood floodColor="var(--p-color)" floodOpacity="0.25" result="color" />
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
      <ClientJBModal id="SkillDetail" isOpen={!!modalContent} onClose={() => setModalContent(null)} className={styles.skillModal}>
        <Activity mode={modalContent=="product"?"visible":"hidden"}>
          <ProductContent/>
        </Activity>
        <Activity mode={modalContent=="backend"?"visible":"hidden"}>
          <BackendSkillItems/>
        </Activity>
        <Activity mode={modalContent=="front"?"visible":"hidden"}>
          <FrontendSkillItems/>
        </Activity>
        <Activity mode={modalContent=="agile"?"visible":"hidden"}>
          <AgileContent/>
        </Activity>
        <Activity mode={modalContent=="ui"?"visible":"hidden"}>
          <UiContent/>
        </Activity>
      </ClientJBModal>
    </section>
  )
}

export default SkillsSection
