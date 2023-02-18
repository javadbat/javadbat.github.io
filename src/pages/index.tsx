import IntroSection from '@/components/index-page/intro-section/IntroSection'
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
      </main>
    </>
  )
}
