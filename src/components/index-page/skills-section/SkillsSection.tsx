import React from 'react'
import BackendSkillItems from './BackendSkillItems'
import FrontendSkillItems from './FrontendSkillItems'
import NonTechnicalSkills from './NonTechnicalSkills'
import { SkillGroups, SkillGroup, SkillGroupTitle, SkillItem, SkillItems, SkillsSectionWrapper, Title } from './styles'

function SkillsSection() {
  return (
    <SkillsSectionWrapper>
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

    </SkillsSectionWrapper>
  )
}

export default SkillsSection