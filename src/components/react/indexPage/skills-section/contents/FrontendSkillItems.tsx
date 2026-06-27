import styles from './common.module.css';

function FrontendSkillItems() {
  return (
    <div className={styles.skillContent}>
      <div slot="header">
        <h2 className={styles.skillTitle}>✦ Front-End Engineering & Scalable Interfaces</h2>
      </div>
      <p className={`${styles.skillParagraph}`}>Front-end development is the core of my professional experience. Over the years, I have worked mostly on admin panels, dashboards, PWA applications, design systems, and data-heavy interfaces, where structure, performance, maintainability, and user experience all matter at the same time.</p>
      <p className={`${styles.skillParagraph} ${styles.indent}`}>My main stack is around <b>React, TypeScript, MobX, Zustand, React Query, Web Components, MUI, GraphQL, WebSocket, Vite, Webpack, Rollup, Tailwind CSS, ShadCN,</b> and <b>Storybook</b>. I have used these tools to build real product interfaces, not only static pages, but applications with complex flows, authentication, forms, tables, charts, maps, live data, and reusable UI architecture.</p>
      <p className={`${styles.skillParagraph}`}>Some of the areas I have worked on include::</p>
      <ul className={styles.SkillUl}>
        <li>Building and designing admin panels, back-office systems, and dashboards</li>
        <li>Developing PWA applications for travel, legal consultation, crypto/fiat products, tracking systems, and insurance-related tools</li>
        <li>Creating reusable component structures and design systems with Web Components, React integration, and Storybook</li>
        <li>Working with real-time data using WebSocket and GraphQL</li>
        <li>Building advanced data and visual interfaces with tools like ChartIQ, MapBox, and Leaflet</li>
        <li>Setting up modern front-end infrastructure with Vite, TanStack Query, Tailwind CSS, ShadCN, Zustand, and Web Components</li>
        <li>Handling complex front-end concerns such as state management, routing, authentication, validation, loading states, and error states</li>
        <li>Leading front-end work and helping teams improve structure, workflow, and product delivery</li>
      </ul>
      <p className={`${styles.skillParagraph}`}>I enjoy front-end work because it combines logic, visual thinking, product understanding, and user experience. For me, a strong front-end is not only about making an interface look good, but about building a system that is clear for users, maintainable for developers, and flexible enough to grow with the product.</p>
    </div>
  )
}

export default FrontendSkillItems