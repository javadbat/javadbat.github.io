import { createGlobalStyle } from "styled-components";
import TitleFontWoffBold from './GTSuperDisplay/GT-Super-Display-Bold.woff';
import TitleFontWoff2Bold from './GTSuperDisplay/GT-Super-Display-Bold.woff2';
import TitleFontWoffRegular from './GTSuperDisplay/GT-Super-Display-Regular.woff';
import TitleFontWoff2Regular from './GTSuperDisplay/GT-Super-Display-Regular.woff2';
//
import QuicksandVariable from './Quicksand/Quicksand-VariableFont_wght.ttf';
export const TitleFontsStyles = createGlobalStyle`

@font-face {
  font-family: "title-font";
  font-weight: 100 400;
  src: url(${TitleFontWoff2Regular}) format('woff2'),
       url(${TitleFontWoffRegular}) format('woff');
}
@font-face {
    font-family: "title-font";
  font-weight: 401 900;
  src: url(${TitleFontWoff2Bold}) format('woff2'),
       url(${TitleFontWoffBold}) format('woff');
}
`
export const CommonFontsStyles = createGlobalStyle`
 
@font-face {
  font-family: "text-font";
  src: url(${QuicksandVariable}) format('truetype');
}`