import ExperiencesSection from '@/components/index-page/experiences-section/ExperiencesSection'
import FeedbackSection from '@/components/index-page/feedback-section/FeedbackSection'
import IntroSection from '@/components/index-page/intro-section/IntroSection'
import SkillsSection from '@/components/index-page/skills-section/SkillsSection'
import { fixMobileHeightVH } from '@/utils/helpers/layout-helper'
import Head from 'next/head'
import { useEffect } from 'react'

export default function Home() {
  useEffect(()=>{
    fixMobileHeightVH();
  },[])
  return (
    <>
      <Head>
        <title>mohammad javad bathaei</title>
        <meta name="description" content="seyed mohammad javad bathaei official website" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <IntroSection></IntroSection>
        <SkillsSection></SkillsSection>
        <ExperiencesSection></ExperiencesSection>
        <FeedbackSection></FeedbackSection>
      </main>
    </>
  )
}
