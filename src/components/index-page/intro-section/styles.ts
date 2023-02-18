import styled, { keyframes } from 'styled-components';
import {down} from 'styled-breakpoints';
export const IntroWrapper = styled.section`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  position: relative;
`
export const IntroContent = styled.div`
  display: grid;
  grid-template-rows: auto auto auto;
`;
export const PageTitle = styled.h1`

  text-align: center;
  font-family: "title-font";
  color:var(--p-color);
  transition: all 0.2s 0s ease;
  margin: 0;
  padding: 0;

  &:hover{
      color:var(--p-color-light);
    }
    `
export const Name = styled.span`
    font-size: 2.5rem;
    display: block;
    letter-spacing: 0.1rem;
    word-spacing: 0.3rem;
    ${down("lg")}{
      font-size:1.4rem;
      word-spacing: 0.2rem;
    }
    `
export const Family = styled.span`
    display: block;
    letter-spacing: -0.5rem;
    font-size: 9.6rem;
    ${down("lg")}{
      font-size:6rem;
    }
`;
export const Subtitle = styled.h2`
    font-size:1.5rem;
    font-weight: 400;
    text-align: center;
    color:var(--p-color-light);
    ${down("lg")}{
      font-size:1rem;
    }
`;
export const MouseIconWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  position: absolute;
  bottom:64px;
  left: calc(50% - 73px);
`;
export const MouseIcon = styled.svg`
  width: 24px;
  height: 24px;
  fill:var(--p-color);
`
const wheelAnimation = keyframes`
  0% {
    transform: translateY(0px);
  }
  50%{
    transform: translateY(3px);
  }
  100% {
    transform: translateY(0px);
  }
`;
export const MouseWheel = styled.path`
  animation: ${wheelAnimation} 1s linear infinite;
`
export const ScrollText = styled.div`
  color:var(--p-color);
`