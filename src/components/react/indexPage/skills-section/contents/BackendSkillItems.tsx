import styles from './common.module.css';

function BackendSkillItems() {
  return (
    <div className={styles.skillContent}>
      <div slot="header">
        <h2 className={styles.skillTitle}>✦ Backend Foundation & Full-Stack Awareness</h2>
      </div>
      <p className={`${styles.skillParagraph}`}>Before becoming fully focused on front-end development, I worked for several years with C#/.NET and SQL Server. That experience gave me a solid understanding of backend logic, database structure, APIs, and how software works behind the interface.</p>
      <p className={`${styles.skillParagraph} ${styles.indent}`}>After that, I spent almost five years mainly focused on front-end development, but my backend background has continued to help me in everyday product work.</p>
      <p className={`${styles.skillParagraph}`}>It helps me to:</p>
      <ul className={styles.SkillUl}>
        <li>Understand API behavior and data flow more clearly</li>
        <li>Communicate better with backend developers</li>
        <li>Design front-end structures that match real backend limitations</li>
        <li>Think about performance, maintainability, and system behavior</li>
        <li>Debug issues with a wider view of the product</li>
        <li>Build small backend services when needed</li>
      </ul>
      <p className={`${styles.skillParagraph}`}>Recently, I have also gained experience with modern backend tools and frameworks such as Node.js, NestJS, Strapi, Ghost, and Rust with Actix Web and PostgreSQL. These projects helped me refresh and expand my backend knowledge while working with different types of backend structures, from CMS-based solutions to custom APIs and database-driven services.</p>
      <p className={`${styles.skillParagraph} ${styles.indent}`}>Although my main professional focus is front-end, I enjoy working on small to mid-sized backend services, especially when they are connected to real product needs. I’m also interested in contributing to larger backend systems as part of a strong team, where an experienced tech lead or supervisor can guide the architecture and help me grow deeper in backend development.</p>
      <p className={`${styles.skillParagraph} ${styles.indent}`}>This backend foundation gives me stronger full-stack awareness and helps me contribute better inside product and development teams.</p>
    </div>
  )
}

export default BackendSkillItems;