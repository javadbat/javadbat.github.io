import styles from './common.module.css';

function AgileContent() {
  return (
    <div className={styles.skillContent}>
      <div slot="header">
        <h2 className={styles.skillTitle}>✦ My Journey: From Coding to Cultivating Agile Teams</h2>
      </div>
      <div slot="content">
        <p className={styles.skillParagraph}>
          My passion has always been building great software. But early in my career, I noticed a common problem: teams worked hard, yet the results often didn't satisfy the customer. We were busy, but were we being productive? This "gap" between effort and value became the central question of my career.
        </p>
        <p className={`${styles.skillParagraph} ${styles.indent}`}>
          I believe that true agility is a mindset, not just a set of frameworks. To me, being agile means building a culture of trust, transparency, and continuous learning. It's about empowering teams to solve problems creatively and adapt to change, not just following a rigid process. This is what I've been exploring in my ongoing work.
        </p>
        <p className={`${styles.skillParagraph} ${styles.indent}`}>
          To deepen my understanding of how organizations truly function, I pursued a Master's in Management with a focus on Quality and Performance. This academic background gave me a powerful toolkit for diagnosing systemic issues, designing effective performance metrics, and understanding the organizational dynamics that make or break a team. It taught me that high performance isn't just about speed—it's about sustainable quality, continuous improvement, and aligning everyone's work with a clear strategic purpose.
        </p>
        <p className={`${styles.skillParagraph} ${styles.indent}`}>I had the opportunity to deep-dive into these ideas as a guest on the "Agile Gap" podcast for five episodes. It was a fantastic platform to discuss the heart of what makes agile work:</p>
        <ul className={styles.SkillUl}>
          <li>
            <b> The Human Element of Productivity:</b>
            We discussed how true productivity comes from a healthy team dynamic, built on trust, open communication, and a shared purpose, rather than just a well-oiled process machine.
            <a href='https://open.substack.com/pub/agilegap/p/teams-elements-productivity'>(Podcast Episode: Productivity and Team Elements)</a>
          </li>
          <li>
            <b>Choosing the Right Tools for the Job:</b>
            I shared my practical experience on when to use frameworks like Scrum and Kanban. I firmly believe you must first understand the problem before you can pick the tool, and that sometimes, a custom combination is the best solution.
            <a href="https://www.agile-gap.com/p/goal-technology-productivity">(Podcast Episode: Goal, Technology, and Productivity)</a>
          </li>
          <li>
            <b>Building a People-First Culture:</b>
            We tackled the crucial (and often overlooked) influence of HR and management policies. A truly agile culture is built on psychological safety and trust, where team members feel safe to experiment and learn from mistakes.
            <a href="https://www.agile-gap.com/p/ir-hr-policies">(Podcast Episode: IR & HR Policies)</a>
          </li>
        </ul>
        <p className={`${styles.skillParagraph}`}>To me, being a developer in an agile environment is about being a catalyst for positive change. I’m passionate about creating spaces where talented people can do their best work and build products that truly matter.</p>
      </div>
    </div>
  )
}

export default AgileContent