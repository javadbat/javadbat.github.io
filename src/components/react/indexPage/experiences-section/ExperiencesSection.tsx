import Experience from './Experience'
import styles from './styles.module.css'
import hamiLogoSrc from '../company-logo/hami.svg'
import bedaanLogoSrc from '../company-logo/bedaan.svg'
import bidopinLogoSrc from '../company-logo/bidopin.svg'
import snapptripLogoSrc from '../company-logo/snapptrip-logo.svg'
import gajLogoSrc from '../company-logo/Gaj-logo.svg'
import iribLogoSrc from '../company-logo/IRIB_Logo.svg'
import kitLogoSrc from '../company-logo/kit-logo.jpeg'
import payaLogoSrc from '../company-logo/payasoft.svg'
import akkaLogoSrc from '../company-logo/akka.svg'
import { Title } from '@react-components/title/Title'

const HamiLogo = ()=><img className={styles.companyLogo} src={hamiLogoSrc.src} alt='hami logo' width={80} height={80}></img>
const BedaanLogo = ()=><img className={styles.companyLogo} src={bedaanLogoSrc.src} alt='bedaan logo' width={80} height={80}></img>
const BidopinLogo = ()=><img className={styles.companyLogo} src={bidopinLogoSrc.src} alt='bidopin logo' width={80} height={80}></img>
const SnappTripLogo = ()=><img className={styles.companyLogo} src={snapptripLogoSrc.src} alt='snapptrip logo' width={80} height={80}></img>
const GajLogo = ()=><img className={styles.companyLogo} src={gajLogoSrc.src} alt='Gaj logo' width={80} height={80}></img>
const IRIBLogo = ()=><img className={styles.companyLogo} src={iribLogoSrc.src} alt='iIRIB logo' width={80} height={80}></img>
const KitLogo = ()=><img className={styles.companyLogo} src={kitLogoSrc.src} alt='KIT logo' width={80} height={80}></img>
const PayaLogo = ()=><img className={styles.companyLogo} src={payaLogoSrc.src} alt='paya logo' width={80} height={80}></img>
const AkkaLogo = ()=><img className={styles.companyLogo} src={akkaLogoSrc.src} alt='akka logo' width={80} height={80}></img>
// const NoLogo = ()=><></>
function ExperiencesSection() {
  return (
    <section className={styles.experiencesSectionWrapper}>
        <Title>Experiences</Title>
        <div className={styles.experienceList}>
            <Experience name="Akka" fromDate={"2023-05-01"} ToDate={"2025-04-30"} Logo={AkkaLogo} desc="Web3 Dex & Logistic platform"></Experience>
            <Experience name="Hami" fromDate={"2021-09-01"} ToDate={"2023-02-30"} Logo={HamiLogo} desc="Cryptocurrency Exchange Platform"></Experience>
            <Experience name="Bedaan" fromDate={"2020-11-01"} ToDate={"2023-03-31"} Logo={BedaanLogo} desc="Stock Market Analyser Tool"></Experience>
            <Experience name="KIT" fromDate={"2020-06-01"} ToDate={"2021-04-30"} Logo={KitLogo} desc="Legal Service Apps"></Experience>
            <Experience name="Snapp Trip" fromDate={"2019-09-01"} ToDate={"2020-06-01"} Logo={SnappTripLogo} desc="Travel & Hotel Service Retail App"></Experience>
            <Experience name="Bidopin" fromDate={"2017-10-01"} ToDate={"2020-08-30"} Logo={BidopinLogo} desc="Distributed Online Shop"></Experience>
            <Experience name="Gaj" fromDate={"2016-10-01"} ToDate={"2017-10-01"} Logo={GajLogo} desc="International Publication"></Experience>
            <Experience name="IRIB" fromDate={"2015-08-01"} ToDate={"2015-10-30"} Logo={IRIBLogo} desc="Iran TV Broadcasting"></Experience>
            <Experience name="Paya Soft" fromDate={"2011-02-01"} ToDate={"2015-07-30"} Logo={PayaLogo} desc="ERP & Office Automation"></Experience>
        </div>
    </section>
  )
}

export default ExperiencesSection