import React from 'react'
import Experience from './Experience'
import { CompanyLogo, ExperienceList, ExperiencesSectionWrapper, Title } from './styles'
import hamiLogoSrc from '../../../../public/Images/company-logo/hami.svg'
import bedaanLogoSrc from '../../../../public/Images/company-logo/bedaan.svg'
import bidopinLogoSrc from '../../../../public/Images/company-logo/bidopin.svg'
import snapptripLogoSrc from '../../../../public/Images/company-logo/snapptrip-logo.svg'
import gajLogoSrc from '../../../../public/Images/company-logo/Gaj-logo.svg'
import iribLogoSrc from '../../../../public/Images/company-logo/IRIB_Logo.svg'
import kitLogoSrc from '../../../../public/Images/company-logo/kit-logo.jpeg'
import payaLogoSrc from '../../../../public/Images/company-logo/payasoft.svg'

const HamiLogo = ()=><CompanyLogo src={hamiLogoSrc} alt='hami logo' width={80} height={80}></CompanyLogo>
const BedaanLogo = ()=><CompanyLogo src={bedaanLogoSrc} alt='bedaan logo' width={80} height={80}></CompanyLogo>
const BidopinLogo = ()=><CompanyLogo src={bidopinLogoSrc} alt='bidopin logo' width={80} height={80}></CompanyLogo>
const SnappTripLogo = ()=><CompanyLogo src={snapptripLogoSrc} alt='snapptrip logo' width={80} height={80}></CompanyLogo>
const GajLogo = ()=><CompanyLogo src={gajLogoSrc} alt='Gaj logo' width={80} height={80}></CompanyLogo>
const IRIBLogo = ()=><CompanyLogo src={iribLogoSrc} alt='iIRIB logo' width={80} height={80}></CompanyLogo>
const KitLogo = ()=><CompanyLogo src={kitLogoSrc} alt='KIT logo' width={80} height={80}></CompanyLogo>
const PayaLogo = ()=><CompanyLogo src={payaLogoSrc} alt='paya logo' width={80} height={80}></CompanyLogo>
// const NoLogo = ()=><></>
function ExperiencesSection() {
  return (
    <ExperiencesSectionWrapper>
        <Title>Experiences</Title>
        <ExperienceList>
            <Experience name="Hami" fromDate={"2021-09-01"} ToDate={"2023-02-30"} Logo={HamiLogo} desc="Cryptocurrency Exchange Platform"></Experience>
            <Experience name="Bedaan" fromDate={"2020-11-01"} ToDate={"2023-03-31"} Logo={BedaanLogo} desc="Stock Market Analyser Tool"></Experience>
            <Experience name="KIT" fromDate={"2020-06-01"} ToDate={"2021-04-30"} Logo={KitLogo} desc="Legal Service Apps"></Experience>
            <Experience name="Snapp Trip" fromDate={"2019-09-01"} ToDate={"2020-06-01"} Logo={SnappTripLogo} desc="Travel & Hotel Service Retail App"></Experience>
            <Experience name="Bidopin" fromDate={"2017-10-01"} ToDate={"2020-08-30"} Logo={BidopinLogo} desc="Distributed Online Shop"></Experience>
            <Experience name="Gaj" fromDate={"2016-10-01"} ToDate={"2017-10-01"} Logo={GajLogo} desc="International Publication"></Experience>
            <Experience name="IRIB" fromDate={"2015-08-01"} ToDate={"2015-10-30"} Logo={IRIBLogo} desc="Iran Govermental TV Organization"></Experience>
            <Experience name="Paya Soft" fromDate={"2011-02-01"} ToDate={"2015-07-30"} Logo={PayaLogo} desc="ERP & Office Automation"></Experience>
        </ExperienceList>
    </ExperiencesSectionWrapper>
  )
}

export default ExperiencesSection