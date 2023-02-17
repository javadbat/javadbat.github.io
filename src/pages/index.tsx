import IntroSection from '@/components/index-page/intro-section/IntroSection'
import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>Create Next App</title>
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
