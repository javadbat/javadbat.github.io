import styles from './common.module.css';

export default function UiContent() {
  return (
    <div className={styles.skillContent}>
      <div slot="header">
        <h2 className={styles.skillTitle}>✦ Design-Minded Front-End Developer</h2>
      </div>
      <div slot="content">
        <p className={styles.skillParagraph}>
         I’m mainly a front-end developer, but UI/UX design has always been a natural part of my journey. While building digital products, I’ve often found myself not only coding interfaces, but also shaping how they look, feel, and work for users.
         </p>
        <p className={`${styles.skillParagraph} ${styles.indent}`}>
          Over time, I’ve designed more than 20 dashboards, websites, and PWA applications on my own, turning product ideas and requirements into practical, user-friendly interfaces.
        </p>
        <p className={`${styles.skillParagraph}`}>
          My experience includes:
        </p>
        <ul className={styles.SkillUl}>
          <li>Designing panels, websites, and PWA applications from concept to implementation</li>
          <li>Collaborating closely with different design teams and understanding their workflows</li>
          <li>Applying core UI/UX principles such as layout, visual hierarchy, consistency, and usability</li>
          <li>Balancing technical implementation with user experience and product thinking</li>
          <li>Continuously learning through real project experience and occasional UI/UX articles</li>
        </ul>
        <p className={`${styles.skillParagraph}`}>Although UI/UX is not my main profession, it strongly supports the way I work as a front-end developer. I believe good interfaces are not only about clean code or attractive visuals, but about creating experiences that feel clear, useful, and easy to use.</p>
      </div>
    </div>
  )
}
