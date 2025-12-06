import React from 'react';
import styles from './RoundCard.module.css';

export function RoundCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`${styles.roundCard} ${className || ''}`}>{children}</div>;
}