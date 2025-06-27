import BackendSkillItems from './BackendSkillItems'
import { SkillsBackground } from './background/SkillsBackground'
import FrontendSkillItems from './FrontendSkillItems'
import NonTechnicalSkills from './NonTechnicalSkills'
import { SkillGroups, SkillGroup, SkillGroupTitle, SkillItems, SkillsSectionWrapper, Title, SkillsContent, SkillsBackgroundWrapper } from './styles'

function SkillsSection() {
  return (
    <SkillsSectionWrapper>
      <SkillsBackgroundWrapper>
        <SkillsBackground></SkillsBackground>
      </SkillsBackgroundWrapper>
      <SkillsContent>
        <Title>Skills</Title>
        <SkillGroups>
          <SkillGroup>
            <SkillGroupTitle>Back-end</SkillGroupTitle>
            <SkillItems>
              <BackendSkillItems></BackendSkillItems>
            </SkillItems>
          </SkillGroup>
          <SkillGroup>
            <SkillGroupTitle>Front-end</SkillGroupTitle>
            <SkillItems>
              <FrontendSkillItems></FrontendSkillItems>
            </SkillItems>
          </SkillGroup>
          <SkillGroup>
            <SkillGroupTitle>Non-Technical</SkillGroupTitle>
            <SkillItems>
              <NonTechnicalSkills></NonTechnicalSkills>
            </SkillItems>
          </SkillGroup>
        </SkillGroups>
      </SkillsContent>

    </SkillsSectionWrapper>
  )
}

export default SkillsSection