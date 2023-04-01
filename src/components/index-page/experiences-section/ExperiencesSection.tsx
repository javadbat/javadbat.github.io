import React from 'react'
import Experience from './Experience'
import { CompanyLogo, ExperienceList, ExperiencesSectionWrapper, Title } from './styles'
import hamiLogoSrc from '../../../../public/Images/company-logo/hami.svg'
import bedaanLogoSrc from '../../../../public/Images/company-logo/bedaan.svg'
const HamiLogo = ()=><CompanyLogo src={hamiLogoSrc} alt='hami logo' width={80} height={80}></CompanyLogo>
const BedaanLogo = ()=><CompanyLogo src={bedaanLogoSrc} alt='bedaan logo' width={80} height={80}></CompanyLogo>
const NoLogo = ()=><></>
function ExperiencesSection() {
  return (
    <ExperiencesSectionWrapper>
        <Title>Experiences</Title>
        <ExperienceList>
            <Experience name="Hami" fromDate={"2021-09-01"} ToDate={"2023-02-30"} Logo={HamiLogo}></Experience>
            <Experience name="Bedaan" fromDate={"2020-11-01"} ToDate={"2023-03-31"} Logo={BedaanLogo}></Experience>
            <Experience name="KIT" fromDate={"2020-06-01"} ToDate={"2021-04-30"} Logo={NoLogo}></Experience>
            <Experience name="Snapp Trip" fromDate={"2019-09-01"} ToDate={"2020-06-01"} Logo={NoLogo}></Experience>
            <Experience name="Bidopin" fromDate={"2017-10-01"} ToDate={"2020-08-30"} Logo={NoLogo}></Experience>
            <Experience name="Gaj" fromDate={"2016-10-01"} ToDate={"2017-10-01"} Logo={NoLogo}></Experience>
            <Experience name="IRIB" fromDate={"2015-08-01"} ToDate={"2015-10-30"} Logo={NoLogo}></Experience>
            <Experience name="Paya Afzar" fromDate={"2011-02-01"} ToDate={"2015-07-30"} Logo={NoLogo}></Experience>
        </ExperienceList>
    </ExperiencesSectionWrapper>
  )
}

export default ExperiencesSection