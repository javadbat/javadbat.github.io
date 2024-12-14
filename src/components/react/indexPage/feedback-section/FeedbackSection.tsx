import React, { lazy } from 'react'
import { ContentWrapper, DescWrapper, FeedbackSectionWrapper, FormWrapper, Title, Desc, FeedbackGrid } from './styles'
declare global {
    namespace JSX {
        interface IntrinsicElements {
            "agileverse-feedback": any;
        }
    }
}

function FeedbackSection() {
    React.useEffect(() => {
        import('agileverse-feedback').then(()=>{
            const feedbackForm = document.querySelector('agileverse-feedback') as any
            feedbackForm.key = "a45dc156a66f344f8e4e9c2649da2785"
        })
    }
    , [])
    return (
        <FeedbackSectionWrapper>
            <FeedbackGrid>

                <ContentWrapper>
                    <Title>Feedback</Title>
                    <DescWrapper>
                        <Desc>feedback is essential for each person who want to make progress and become better each day</Desc>
                        <Desc>by giving me a Feedback you help me to see my life and decisions from your perspective so more feedback from different peoples would let me see myself in a 360° view</Desc>
                        <Desc>so i would be really glad if you give me a feedback and help me to become a better person :)</Desc>
                    </DescWrapper>
                </ContentWrapper>
                <FormWrapper>
                    <agileverse-feedback theme="light"
                        title="Feedback Form"
                        rate-description="Which Emoji Would Express You're Feeling About Me Better?"
                        description-placeholder="like: how could I be a better person in your opinion"
                        description-label="any suggestion"
                        description-message="it's anonymous so feel free to open up"
                        submit-button-text="submit your feedback"
                        thanks-cta-text="create your own feedback form"
                        thanks-title="thank you 😻"
                        thanks-subtitle=""
                    ></agileverse-feedback>
                </FormWrapper>
            </FeedbackGrid>

        </FeedbackSectionWrapper>
    )
}

export default FeedbackSection