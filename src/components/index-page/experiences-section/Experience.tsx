import React, { useMemo } from 'react';
import {CompanyDESC, CompanyName, ExperienceDate, ExperienceWrapper } from './styles';

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
    <ExperienceWrapper>
        <CompanyName>{name}</CompanyName>
        <ExperienceDate>{FromDateString}-{ToDateString}</ExperienceDate>
        <Logo></Logo>
        <CompanyDESC>{desc}</CompanyDESC>
    </ExperienceWrapper>
  )
}

export default Experience;