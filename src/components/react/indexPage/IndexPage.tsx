import { createStyledBreakpointsTheme } from 'styled-breakpoints'
import { fixMobileHeightVH } from '../../../utils/helpers/layout-helper'
import ExperiencesSection from './experiences-section/ExperiencesSection'
import FeedbackSection from './feedback-section/FeedbackSection'
import IntroSection from './intro-section/IntroSection'
import SkillsSection from './skills-section/SkillsSection'
import { useEffect } from 'react'
import { ThemeProvider } from 'styled-components'
import { MainSectionsWrapper } from './styles'


const theme = createStyledBreakpointsTheme();
type ThemeConfig = typeof theme;

declare module 'styled-components' {
  export interface DefaultTheme extends ThemeConfig { }
}

export function IndexPage() {
  useEffect(() => {
    fixMobileHeightVH();
  }, [])
  return (
    <MainSectionsWrapper>
      <ThemeProvider theme={theme}>
        <IntroSection></IntroSection>
        <SkillsSection></SkillsSection>
        <ExperiencesSection></ExperiencesSection>
        <FeedbackSection ></FeedbackSection>
      </ThemeProvider>
    </MainSectionsWrapper>
  )
}
