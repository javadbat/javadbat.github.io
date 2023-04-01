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
      letter-spacing: -0.5rem;
    }

`;
export const ExperienceList = styled.div``;