import React from 'react';
import styles from './styles.module.css';

function BackendSkillItems() {
  return (
    <>
        <div className={styles.skillItem}>Nodejs</div>
        <div className={styles.skillItem}>MongoDB</div>
        <div className={styles.skillItem}>NestJs</div>
        <div className={styles.skillItem}>Ghost</div>
        <div className={styles.skillItem}>Strapi</div>
        <div className={styles.skillItem}>Express</div>
        <div className={styles.skillItem}>SqlServer</div>
        <div className={styles.skillItem}>PostgreSQL</div>
        <div className={styles.skillItem}>Rust</div>
        <div className={styles.skillItem}>Docker</div>
    </>
  )
}

export default BackendSkillItems;