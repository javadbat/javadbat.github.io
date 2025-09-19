import {styled} from "styled-components";

export const MainSectionsWrapper = styled.main`
  width: 100vw;
  height: 100dvh;
  overflow: auto;
  scroll-snap-type: y proximity;
  scrollbar-color:var(--p-color) transparent;
  scrollbar-width: thin;
`;