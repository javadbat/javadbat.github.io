'use client'
import { useEffect } from 'react';
import type {SkillsBackground as SkillsBackgroundWebComponent} from './skills-background';
declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'skills-background': SkillsBackgroundType;
    }
    interface SkillsBackgroundType extends React.DetailedHTMLProps<React.HTMLAttributes<SkillsBackgroundWebComponent>, SkillsBackgroundWebComponent> {
      class?: string,
      name?: string,
      ref?:React.RefObject<SkillsBackgroundWebComponent>,
      "sphere-fill-percent":string
    }
  }
}
export function SkillsBackground(props:Props) {
  useEffect(()=>{
    import('./skills-background')
  },[])
  return (
    <skills-background sphere-fill-percent={props.sphereFillPercent.toString()}></skills-background>
  )
}

type Props = {
  sphereFillPercent:number
}
