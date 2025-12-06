import React, { useMemo } from 'react';
import styles from './styles.module.css';

type ExperienceProps = {
  name:string,
  fromDate:string,
  ToDate:string,
  Logo:React.FC,
  desc:string,
}
const Experience: React.FC<ExperienceProps> = ({name,fromDate,ToDate,Logo,desc})=>{
    const FromDateString = useMemo(()=>{return Intl.DateTimeFormat("en",{dateStyle:"medium"}).format(new Date(fromDate)) },[fromDate])
    const ToDateString = useMemo(()=>{return Intl.DateTimeFormat("en",{dateStyle:"medium"}).format(new Date(ToDate)) },[ToDate]);
  return (
    <div className={styles.experienceWrapper}>
        <div className={styles.companyName}>{name}</div>
        <div className={styles.experienceDate}>{FromDateString}-{ToDateString}</div>
        <Logo></Logo>
        <div className={styles.companyDESC}>{desc}</div>
    </div>
  )
}

export default Experience;