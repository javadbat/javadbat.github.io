import Image from "next/image";
import { down } from "styled-breakpoints";
import styled from "styled-components";

export const ExperiencesSectionWrapper = styled.section`
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

    ${down("lg")}{
      font-size:1.7rem;
      letter-spacing: -0.05rem;
    }
`;
export const ExperienceList = styled.div`
    margin-block:64px;
    display: grid;
    grid-template-columns:1fr 1fr 1fr;
    gap:32px;
    ${down("xl")}{
      margin-inline:32px;
      grid-template-columns: 1fr 1fr ;
    }
    ${down("md")}{
      margin-inline:32px;
      grid-template-columns: 1fr ;
    }
  `;
//
export const ExperienceWrapper = styled.div`
  display: grid;
  grid-template-columns: 80px 1fr;
  grid-template-rows: auto 18px 1fr;
  grid-template-areas: "logo co-name" "logo date" "logo desc" ;
  gap:4px 16px;
  
`;
export const CompanyName = styled.div`
  grid-area: co-name;
  color:var(--p-color);
  font-size: 1.5rem;
  font-weight:600;
  ${down("lg")}{
      font-size:1.2rem;
    }
`
export const ExperienceDate = styled.div`
  grid-area: date;
  color:var(--mid-grey);
  font-size: 0.8rem;
  font-weight:100;
`
export const CompanyLogo = styled(Image)`
  grid-area: logo;
  object-fit: contain;
`;
export const CompanyDESC = styled.div`
  grid-area: desc;
  /* color:var(--p-color); */
  font-size: 1.0rem;
  font-weight:400;
`;