import React from 'react'
import Experience from './Experience'
import { ExperienceList, ExperiencesSectionWrapper, Title } from './styles'

function ExperiencesSection() {
  return (
    <ExperiencesSectionWrapper>
        <Title>Experiences</Title>
        <ExperienceList>
            <Experience name="Hami" fromDate={"2021-09-01"} ToDate={"2023-02-30"}></Experience>
            <Experience name="Bedaan" fromDate={"2020-11-01"} ToDate={"2023-03-31"}></Experience>
            <Experience name="KIT" fromDate={"2020-06-01"} ToDate={"2021-04-30"}></Experience>
            <Experience name="Snapp Trip" fromDate={"2019-09-01"} ToDate={"2020-06-01"}></Experience>
            <Experience name="Bidopin" fromDate={"2017-10-01"} ToDate={"2020-08-30"}></Experience>
            <Experience name="Gaj" fromDate={"2016-10-01"} ToDate={"2017-10-01"}></Experience>
            <Experience name="IRIB" fromDate={"2015-08-01"} ToDate={"2015-10-30"}></Experience>
            <Experience name="Paya Afzar" fromDate={"2011-02-01"} ToDate={"2015-07-30"}></Experience>
        </ExperienceList>
    </ExperiencesSectionWrapper>
  )
}

export default ExperiencesSection