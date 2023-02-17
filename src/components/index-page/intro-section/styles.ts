import styled from 'styled-components';
import {down} from 'styled-breakpoints';
export const IntroWrapper = styled.section`
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`

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
    color:var(--p-color-light);
    ${down("lg")}{
      font-size:1rem;
    }
`;