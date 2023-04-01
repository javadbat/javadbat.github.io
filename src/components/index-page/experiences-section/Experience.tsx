import React, { useMemo } from 'react';
import {CompanyName, ExperienceDate, ExperienceWrapper } from './styles';

type ExperienceProps = {
  name:string,
  fromDate:string,
  ToDate:string,
  Logo:React.FC,
}
const Experience: React.FC<ExperienceProps> = ({name,fromDate,ToDate,Logo})=>{
    const FromDateString = useMemo(()=>{return Intl.DateTimeFormat("en",{dateStyle:"medium"}).format(new Date(fromDate)) },[fromDate])
    const ToDateString = useMemo(()=>{return Intl.DateTimeFormat("en",{dateStyle:"medium"}).format(new Date(ToDate)) },[ToDate]);
  return (
    <ExperienceWrapper>
        <CompanyName>{name}</CompanyName>
        <ExperienceDate>{FromDateString}-{ToDateString}</ExperienceDate>
        <Logo></Logo>
    </ExperienceWrapper>
  )
}

export default Experience;