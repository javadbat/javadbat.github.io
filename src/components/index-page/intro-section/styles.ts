import styled from 'styled-components';
export const IntroWrapper = styled.section`
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
`

export const PageTitle = styled.h1`
  font-size: 9.6rem;
  text-align: center;
  font-family: "title-font";
  color:var(--p-color);
  transition: all 0.2s 0s ease;
  &:hover{
    color:var(--p-color-light);
  }
`
export const Name = styled.span`
    font-size: 3rem;
    display: block;
`
export const Family = styled.span`
    display: block;
`;