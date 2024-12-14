import styled from "styled-components";
export const SkillsSectionWrapper = styled.section`
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    position: relative;
    display: flex;
`;
export const Title = styled.h2`
      text-align: center;
      color:var(--p-color);
      transition: all 0.2s 0s ease;
      margin: 0;
      padding: 0;
      font-family: "title-font";
      font-size: 3.5rem;
      display: block;
      letter-spacing: -0.1rem;
      &:hover{
      color:var(--p-color-light);
      }

    ${({theme})=>theme.breakpoints.down("lg")}{
      font-size:1.7rem;
      letter-spacing: -0.05rem;
    }

`;
export const SkillGroups = styled.div`
  display: grid;
  grid-template-columns: 2fr 3fr 2fr ;
  max-width: 1200px;
  margin: 64px auto;
  gap:32px;
  ${({theme})=>theme.breakpoints.down("lg")}{
    margin: 32px 32px;
    grid-template-columns: 1fr ;
    grid-template-rows: auto auto auto ;
  }
`;
export const SkillGroup = styled.div``;
export const SkillGroupTitle = styled.div`
  font-size: 2rem;
  text-align: center;
  text-align: center;
  font-weight: 600;
  ${({theme})=>theme.breakpoints.down("lg")}{
      font-size:1.2rem;
    }
`;
export const SkillItems = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap:8px;
  margin-block: 32px;
  justify-content: center;
`;
export const SkillItem = styled.div`
  display: inline;
  &:nth-child(n){
    &::after{
      content: ', ';
    }
  }
`;
