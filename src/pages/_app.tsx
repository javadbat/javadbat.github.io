import { TitleFontsStyles } from '@/fonts/font'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Fragment } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  return <Fragment>
    <TitleFontsStyles></TitleFontsStyles>
    <Component {...pageProps} />
  </Fragment>
}
