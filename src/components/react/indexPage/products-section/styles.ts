import { RoundCard } from "@react-components/card/RoundCard";
import {styled} from "styled-components";

export const ProductsSectionWrapper = styled.div`
      width: 100%;
    min-height: 100% ;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    position: relative;
    display: flex;
    box-sizing: border-box;
    scroll-snap-align: start;
    scroll-snap-stop:always;
`;

export const ProductList = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap:2rem;
  margin-block: 4rem;
  ${({ theme }) => theme.breakpoints.down("xl")}{
    margin-block:2rem;
    margin-inline: 2rem;
    grid-template-columns: 1fr ;
  }
`;
export const ProductLink = styled.a.attrs({ target: "_blank" })`
  text-decoration: none;
  color: inherit;
`;

export const ProductCard = styled(RoundCard)`
  display: grid;
  grid-template-rows: 15rem max-content max-content;
  gap:1rem;
  width: 30rem;
  padding-block-end: 2rem;

  ${({ theme }) => theme.breakpoints.down("md")}{
    width: 100%;
  }
`
export const ProductImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const ProductTitle = styled.h3`
  padding-inline:1rem;
  padding-block: 0;
  margin: 0;
  font-weight: bold;
  font-size: 1.5rem;
  ${({ theme }) => theme.breakpoints.down("sm")}{
    font-size: 1rem;
  }
`;

export const ProductDescription = styled.p`
  padding-inline:1rem;
  padding-block: 0;
  margin: 0;
    ${({ theme }) => theme.breakpoints.down("sm")}{
    font-size: 0.8rem;
  }
`;