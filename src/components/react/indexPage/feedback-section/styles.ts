import {styled} from "styled-components";
export const FeedbackSectionWrapper = styled.section`
    width: 100%;
    min-height: 100%;
    justify-content: center;
    align-items: center;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    scroll-snap-align: start;
    scroll-snap-stop:always;

    ${({ theme }) => theme.breakpoints.down('xl')}{
      padding: 2rem ;
    }

`;
export const FeedbackGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    max-width: 1200px;
    gap:2rem;
    ${({ theme }) => theme.breakpoints.down('md')}{
      grid-template-columns:1fr;
      width: 100%;
      grid-template-rows: min-content min-content;
    }
`;
export const FormWrapper = styled.div`
  --av-feedback-bg:var(--light-grey);
  --av-feedback-title-color:var(--p-color-light);
  --av-feedback-button-bg-color:var(--p-color);
  --av-feedback-button-bg-color-hover:var(--p-color-light);
`;
export const ContentWrapper = styled.div`
  font-size: 1.5rem;
  ${({ theme }) => theme.breakpoints.down("lg")}{
      font-size:1rem;
    }
`;
export const Title = styled.h2`
      text-align: start;
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

    ${({ theme }) => theme.breakpoints.down("lg")}{
      font-size:1.7rem;
      letter-spacing: -0.05rem;
    }

`;
export const DescWrapper = styled.article``;
export const Desc = styled.p``;