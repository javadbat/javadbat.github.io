import React from 'react';
import styles from './Title.module.css';

export function Title({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`${styles.title} ${className || ''}`}>{children}</h2>;
}