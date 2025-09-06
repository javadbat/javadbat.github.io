import type { PropsWithChildren } from "react";
import styled from "styled-components";

export function CTAButton(props: PropsWithChildren<{}>) {
  return (
    <ButtonWrapper href="https://www.linkedin.com/in/javad-bathaei/" target="_blank">
      <Button>
        {props.children}
        <span className="drop-shadow"></span>
      </Button>
    </ButtonWrapper>
  )
}
 const ButtonWrapper = styled.a`
  display: flex;
  justify-content: center;
  text-decoration: none;
 `
 const Button = styled.button`
  font-size: clamp(0.7rem, 1rem, 1.25rem);
  font-weight:600;
  text-transform: none;
  cursor: pointer;
  color: var(--p-color);
  min-width: max-content;
  width:15vw;
  max-width:  100% ;
  height: 3em;
  line-height: 1;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 0.5em 1.5em;
  outline: none!important;
  border-radius: 99vw;
  box-sizing: border-box;
  
  --brdr: 0.15em;
  border: max(2px, var(--brdr)) solid transparent;
  
  background: 
      linear-gradient( to bottom, 
          oklch(0.95 0.01 257), 
          oklch(0.92 0.0175 257 / 80%) 33%, 
          oklch(0.99 0.01 257 / 80%)) padding-box,
      linear-gradient( 165deg, 
          oklch(0.94 0.025 257 / 80%) 25%, 
          oklch(0.99 0.01 257 / 80%)) border-box;
  
  --ibxs:
      inset -0.35em -0.35em 0.25em -0.25em oklch(0.99 0.02 257),
      inset -0.33em -1em 0.75em -0.75em oklch(0.99 0.01 257);
  --bxs: 
      oklch(0.35 0.1 257 / 0.12) 0px max(4px, 0.3em) 0.3em 0px, 
      oklch(0.35 0.1 257 / 0.12) 0px max(2px, 0.18em) 0.18em 0px, 
      oklch(0.35 0.1 257 / 0.1) 0px max(1px, 0.05em) max(2px, 0.05em) 0px;
  
  /* if the drop-shadow element is missing, put it here */
  box-shadow: var(--ibxs), var(--bxs);
  /* if the drop-shadow element exists, hide it here */
  &:has(.drop-shadow) {
    box-shadow: var(--ibxs);
  }

  &:before,
    &:after,
    & .drop-shadow,
    & .drop-shadow:after,
    & .drop-shadow:before {
        content: "";
        position: absolute;
        inset: min(-2px, calc(var(--brdr) * -1));
        border-radius: inherit;
        pointer-events: none;
        transition: all 0.6s var(--cubic-in);
    }

      &:hover {
        &:before,
        &:after,
        & .drop-shadow,
        & .drop-shadow:after,
        & .drop-shadow:before {
            transition-duration: 0.3s;
            transition-timing-function: var(--cubic-out);
        }
    }

    &:after {
        
        /* inner glassy glow */
        
        opacity: 0.3;
        background: transparent;
        box-shadow: 
            inset 0 -0.3em 2px 1px oklch(0.99 0.01 257),
            inset 0 -0.3em 0.25em oklch(0.99 0.01 257),
            inset 0 -0.3em 0.5em oklch(0.99 0.01 257),
            inset 0 -0.3em 0.75em oklch(0.99 0.01 257),
            inset 0 -0.3em 1em oklch(0.99 0.01 257);
        mix-blend-mode: lighten;
        z-index: 2;
    }
    
    & .drop-shadow {
        box-shadow: var(--bxs);
        z-index: -2;
    }
    
    &:before,
    & .drop-shadow:after {
        
        /* iridescence */
        
        opacity: 0;
        translate: 1.1em -0.1em;
        scale: 0.8;
        background: linear-gradient(
            98deg in oklab,
            oklch(97% 0.26 10 / 0%) -5%,
            oklch(97% 0.26 10) 55%, 
            oklch(100% 0.18 55) 62%, 
            oklch(93% 0.15 138) 66%, 
            oklch(96% 0.18 245) 76%, 
            oklch(100% 0.25 275) 120%
        );
        mask: linear-gradient(166deg, transparent 60%, black);
        filter:  blur(3px) brightness(1) contrast(1.3);
        box-shadow: 
            inset 0 max(-2px, calc(var(--brdr) * -1)) 0 min(2px, var(--brdr)) oklch(0.99 0.01 257 / 20%),
            inset 0 -0.25em 0.25em 0.125em oklch(0.99 0.01 257 / 40%);
        z-index: 3;
    }
    
    & .drop-shadow:after {
        
        /* outer iridescence */
        
        opacity: 0;
        translate: -0.25em 1.2em;
        scale: -1 0.8;
        filter:  blur(8px) brightness(1.2) contrast(1.05);
        mix-blend-mode: lighten;
        background-position: center;
        
        mask: radial-gradient(
            closest-side, 
            hsl(0, 0%, 100%) 0%,
            hsla(0, 0%, 100%, 0.987) 8.1%,
            hsla(0, 0%, 100%, 0.951) 15.5%,
            hsla(0, 0%, 100%, 0.896) 22.5%,
            hsla(0, 0%, 100%, 0.825) 29%,
            hsla(0, 0%, 100%, 0.741) 35.3%,
            hsla(0, 0%, 100%, 0.648) 41.2%,
            hsla(0, 0%, 100%, 0.55) 47.1%,
            hsla(0, 0%, 100%, 0.45) 52.9%,
            hsla(0, 0%, 100%, 0.352) 58.8%,
            hsla(0, 0%, 100%, 0.259) 64.7%,
            hsla(0, 0%, 100%, 0.175) 71%,
            hsla(0, 0%, 100%, 0.104) 77.5%,
            hsla(0, 0%, 100%, 0.049) 84.5%,
            hsla(0, 0%, 100%, 0.013) 91.9%,
            hsla(0, 0%, 100%, 0) 100%
        );
        z-index: -2;
        
    }
    
    & .drop-shadow:before {
        
        /* outer glassy glow */
        
        opacity: 1;
        translate: 1.2em 1.1em;
        scale: 1.5 0.8;
        background: red;
        background: oklch(0.98 0.03 257);
        
        mask: radial-gradient(
            closest-side, 
            hsl(0, 0%, 100%) 0%,
            hsla(0, 0%, 100%, 0.987) 8.1%,
            hsla(0, 0%, 100%, 0.951) 15.5%,
            hsla(0, 0%, 100%, 0.896) 22.5%,
            hsla(0, 0%, 100%, 0.825) 29%,
            hsla(0, 0%, 100%, 0.741) 35.3%,
            hsla(0, 0%, 100%, 0.648) 41.2%,
            hsla(0, 0%, 100%, 0.55) 47.1%,
            hsla(0, 0%, 100%, 0.45) 52.9%,
            hsla(0, 0%, 100%, 0.352) 58.8%,
            hsla(0, 0%, 100%, 0.259) 64.7%,
            hsla(0, 0%, 100%, 0.175) 71%,
            hsla(0, 0%, 100%, 0.104) 77.5%,
            hsla(0, 0%, 100%, 0.049) 84.5%,
            hsla(0, 0%, 100%, 0.013) 91.9%,
            hsla(0, 0%, 100%, 0) 100%
        );
        z-index: -1;
        
    }
    
    
    /* hover / focus styles */
    
    &:hover,
    &:focus {
        
        opacity: 1;
        color: #3c5a80;
        /* if the drop-shadow element is missing, put it here */
        box-shadow: var(--ibxs), var(--bxs);
        /* if the drop-shadow element exists, hide it here */
        &:has(.drop-shadow) {
            box-shadow: var(--ibxs);
        }
        
        &:after,
        &:before,
        & .drop-shadow:after {
            opacity: 0.8;
        }
        &:before {
            opacity: 0.4;
            translate: 0em;
            scale: 1;
        }
        & .drop-shadow:after {
            opacity: 0.4;
            translate: 1.8em 1.2em;
            scale: -1 1;
        }
        
    }
    
    &:focus {
        
        border-color: oklch(0.99 0.01 257 / 70%);
        
    }
`;
