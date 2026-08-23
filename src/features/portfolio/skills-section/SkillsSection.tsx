import { useMediaQuery } from "usehooks-ts";
import BackendSkillItems from "./contents/BackendSkillItems";
import { SkillsBackground } from "./background/SkillsBackground";
import FrontendSkillItems from "./contents/FrontendSkillItems";
import { useBulletPoints, useHalfCirclePath, useSyncSize } from "./hooks";
import AgileContent from "./contents/AgileContent";
import styles from "./styles.module.css";
import { Activity, useCallback, useEffect, useState } from "react";
import ProductContent from "./contents/ProductContent";
import { ModalCloseButton } from "../../../components/react/components/modal/ModalCloseButton";
import contentStyles from "./contents/common.module.css";
import UiContent from "./contents/UiContent";
import { JBModal } from "jb-modal/react";

type SkillModalContent = "product" | "agile" | "front" | "backend" | "ui";

const SKILL_MODAL_EXIT_DURATION_MS = 300;

const skillModalTitles: Record<SkillModalContent, string> = {
  product: "✦ Product Awareness & Team Collaboration",
  agile: "✦ My Journey: From Coding to Cultivating Agile Teams",
  front: "✦ Front-End Engineering & Scalable Interfaces",
  backend: "✦ Backend Foundation & Full-Stack Awareness",
  ui: "✦ Design-Minded Front-End Developer",
};

function SkillsSection() {
  const { contentHeightShare, sphereGapPercent, variableStyle } = useSyncSize();
  const halfCirclePath = useHalfCirclePath();
  const bullets = useBulletPoints();
  const matches = useMediaQuery("(max-aspect-ratio: 1/1)");
  const [modalContent, setModalContent] = useState<SkillModalContent | null>(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const openModal = useCallback((content: SkillModalContent) => {
    setModalContent(content);
    setModalIsOpen(true);
  }, []);
  const closeModal = useCallback(() => {
    setModalIsOpen(false);
  }, []);

  useEffect(() => {
    if (modalIsOpen || !modalContent) {
      return;
    }

    const cleanupTimer = window.setTimeout(() => {
      setModalContent(null);
    }, SKILL_MODAL_EXIT_DURATION_MS);

    return () => window.clearTimeout(cleanupTimer);
  }, [modalContent, modalIsOpen]);

  return (
    <section className={styles.skillsSectionWrapper} style={variableStyle}>
      <div className={styles.skillsBackgroundWrapper}>
        <SkillsBackground sphereFillPercent={contentHeightShare - sphereGapPercent}></SkillsBackground>
      </div>
      <div className={styles.skillsContentWrapper}>
        <div className={styles.skillsContent} style={{ height: `${contentHeightShare}%` }}>
          <h2 className={styles.title}>
            <span>Skills</span>
          </h2>
          <svg className={styles.dividerSVG} viewBox="0 0 265 120">
            <title>Skills</title>
            <path d={halfCirclePath} fill="none" filter="url(#softShadow)" />
            <g className={styles.skillsGroup}>
              <g transform={`translate(${bullets.ui.x}, ${bullets.ui.y})`} className={styles.skillGroup} onClick={() => openModal("ui")}>
                <circle cx="0" cy="0" r="1" className={styles.bullet}></circle>
                <text className={`${styles.skillGroupTitle}`} data-size="sm">
                  UI/UX Designer
                </text>
                <text className={`${styles.skillGroupDescription}`} data-size="sm">
                  {" "}
                  Broad Understanding UI/UX Principles & Like to Create a Creative One
                </text>
              </g>
              <g transform={`translate(${bullets.backend.x}, ${bullets.backend.y})`} className={styles.skillGroup} onClick={() => openModal("backend")}>
                <circle cx="0" cy="0" r="2" className={styles.bullet}></circle>
                <text className={`${styles.skillGroupTitle}`} data-size="md">
                  Back-end Developer
                </text>
                {!matches ? (
                  <text className={`${styles.skillGroupDescription}`} data-size="md">
                    Good proficiency for Small/Mid Projects in NodeJS,Rust,C#
                  </text>
                ) : (
                  <text className={`${styles.skillGroupDescription}`} data-size="md">
                    Good proficiency for Small/Mid Projects in
                    <tspan x="0" dy="6">
                      NodeJS,Rust,C#
                    </tspan>
                  </text>
                )}
              </g>
              <g transform={`translate(${bullets.frontend.x}, ${bullets.frontend.y})`} className={styles.skillGroup} onClick={() => openModal("front")}>
                <circle cx="0" cy="0" r="4" className={styles.bullet}></circle>
                <text className={`${styles.skillGroupTitle}`}>Front-end Developer</text>
                {!matches && <text className={`${styles.skillGroupDescription}`}>Expert in Front-end Development, React, Web component,...</text>}
                {matches && (
                  <text className={`${styles.skillGroupDescription}`}>
                    Expert in Front-end Development
                    <tspan x="0" dy="6">
                      React, Web component,...
                    </tspan>
                  </text>
                )}
              </g>
              <g transform={`translate(${bullets.agile.x}, ${bullets.agile.y})`} className={styles.skillGroup} onClick={() => openModal("agile")}>
                <circle cx="0" cy="0" r="2" className={styles.bullet}></circle>
                <text className={`${styles.skillGroupTitle}`} data-size="md">
                  Agile & Management
                </text>
                {!matches ? (
                  <text className={`${styles.skillGroupDescription}`} data-size="md">
                    Foundational Understanding of Agile Methodologies an Human Behaviors
                  </text>
                ) : (
                  <text className={`${styles.skillGroupDescription}`} data-size="md">
                    Foundational Understanding of Agile Methodologies
                    <tspan x="0" dy="6">
                      an Human Behaviors
                    </tspan>
                  </text>
                )}
              </g>
              <g transform={`translate(${bullets.product.x}, ${bullets.product.y})`} className={styles.skillGroup} onClick={() => openModal("product")}>
                <circle cx="0" cy="0" r="1" className={styles.bullet}></circle>
                <text className={`${styles.skillGroupTitle}`} data-size="sm">
                  Product & Soft Skills
                </text>
                <text className={`${styles.skillGroupDescription}`} data-size="sm">
                  Able to Understand User Needs & balance Cost/Quality
                </text>
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
      <Activity mode={modalContent ? "visible" : "hidden"}>
        <JBModal
          id="SkillDetail"
          isOpen={modalIsOpen}
          label={modalContent ? skillModalTitles[modalContent] : "Skills"}
          onClose={closeModal}
          className={styles.skillModal}
        >
          <div slot="header">
            <div>
              <h2 className={contentStyles.skillTitle}>{modalContent ? skillModalTitles[modalContent] : "Skills"}</h2>
            </div>
            <ModalCloseButton label="Close" onClick={closeModal} />
          </div>
          <div slot="content">
            <Activity mode={modalContent == "product" ? "visible" : "hidden"}>
              <ProductContent />
            </Activity>
            <Activity mode={modalContent == "backend" ? "visible" : "hidden"}>
              <BackendSkillItems />
            </Activity>
            <Activity mode={modalContent == "front" ? "visible" : "hidden"}>
              <FrontendSkillItems />
            </Activity>
            <Activity mode={modalContent == "agile" ? "visible" : "hidden"}>
              <AgileContent />
            </Activity>
            <Activity mode={modalContent == "ui" ? "visible" : "hidden"}>
              <UiContent />
            </Activity>
          </div>
        </JBModal>
      </Activity>
    </section>
  );
}

export default SkillsSection;
