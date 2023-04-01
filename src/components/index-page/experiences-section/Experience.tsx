import Image from 'next/image';
import React, { useMemo } from 'react';
import {CompanyName, ExperienceDate, ExperienceWrapper } from './styles';

function Experience({name,fromDate,ToDate,Logo}) {
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