import styles from './common.module.css';

export default function ProductContent() {
  return (
    <div className={styles.skillContent}>
      <div slot="header">
        <h2 className={styles.skillTitle}>✦ Product Awareness & Team Collaboration</h2>
      </div>
      <p className={`${styles.skillParagraph}`}>When I work on a new feature, I like to look beyond the task itself. Before thinking only about the code, I try to understand why we are building it, who is going to use it, and what kind of problem it should solve.</p>
      <p className={`${styles.skillParagraph} ${styles.indent}`}>his mindset is especially important in admin panels and dashboards, where users usually work with data, actions, forms, and daily workflows. A small design or development decision can make the product easier, faster, and more comfortable to use.</p>
      <p className={`${styles.skillParagraph} ${styles.indent}`}>In the development process, I usually try to focus on:</p>
      <ul className={styles.SkillUl}>
        <li>Understanding the real need behind each request</li>
        <li>Thinking about how users will interact with the feature in real situations</li>
        <li>Suggesting simpler solutions when they can save time or reduce cost</li>
        <li>Balancing quality, development effort, and long-term maintainability</li>
        <li>Turning product ideas into clear and practical user interfaces</li>
        <li>Staying flexible when priorities, requirements, or business needs change</li>
      </ul>
      <p className={`${styles.skillParagraph}`}>For me, good software is not only about building what was requested, but about helping the team build what is actually useful. I enjoy being part of this process and contributing as a developer who cares about both the product and the people who use it.</p>
    </div>
  )
}
