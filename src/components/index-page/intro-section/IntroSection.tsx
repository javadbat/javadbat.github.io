import React from 'react'
import { Family, IntroContent, IntroWrapper, MouseIcon, MouseIconWrapper, MouseWheel, Name, PageTitle, ScrollText, Subtitle } from './styles'

function IntroSection() {
    return (
        <IntroWrapper>
            <IntroContent>
                <PageTitle>
                    <Name>Seyed Mohammad Javad</Name>
                    <Family>Bathaei</Family>
                </PageTitle>
                <Subtitle >Creative Front-end Web Developer</Subtitle>
            </IntroContent>
            <MouseIconWrapper>
                <MouseIcon viewBox="0 0 24 24" fill="none" >
                    <g clipPath="url(#clip0_403_2919)">
                        <path d="M13.0001 3V1C13.0001 0.734784 12.8948 0.48043 12.7072 0.292893C12.5197 0.105357 12.2653 0 12.0001 0C11.7349 0 11.4806 0.105357 11.293 0.292893C11.1055 0.48043 11.0001 0.734784 11.0001 1V3C9.14426 3.00212 7.36501 3.7403 6.05271 5.05259C4.74042 6.36489 4.00224 8.14413 4.00012 10V16C4.00012 18.1217 4.84298 20.1566 6.34327 21.6569C7.84356 23.1571 9.87839 24 12.0001 24C14.1219 24 16.1567 23.1571 17.657 21.6569C19.1573 20.1566 20.0001 18.1217 20.0001 16V10C19.998 8.14413 19.2598 6.36489 17.9475 5.05259C16.6352 3.7403 14.856 3.00212 13.0001 3ZM18.0001 16C18.0001 17.5913 17.368 19.1174 16.2428 20.2426C15.1175 21.3679 13.5914 22 12.0001 22C10.4088 22 8.8827 21.3679 7.75748 20.2426C6.63226 19.1174 6.00012 17.5913 6.00012 16V10C6.00171 8.67441 6.529 7.40356 7.46634 6.46622C8.40368 5.52888 9.67453 5.00159 11.0001 5H13.0001C14.3257 5.00159 15.5966 5.52888 16.5339 6.46622C17.4712 7.40356 17.9985 8.67441 18.0001 10V16Z" />
                        <MouseWheel d="M12.0001 7.00031C11.7349 7.00031 11.4806 7.10566 11.293 7.2932C11.1055 7.48073 11.0001 7.73509 11.0001 8.0003V10.0003C11.0001 10.2655 11.1055 10.5199 11.293 10.7074C11.4806 10.8949 11.7349 11.0003 12.0001 11.0003C12.2653 11.0003 12.5197 10.8949 12.7072 10.7074C12.8948 10.5199 13.0001 10.2655 13.0001 10.0003V8.0003C13.0001 7.73509 12.8948 7.48073 12.7072 7.2932C12.5197 7.10566 12.2653 7.00031 12.0001 7.00031Z" />
                    </g>
                    <defs>
                        <clipPath id="clip0_403_2919">
                            <rect width="24" height="24" fill="white" />
                        </clipPath>
                    </defs>
                </MouseIcon>
                <ScrollText>Scroll for More</ScrollText>
            </MouseIconWrapper>
        </IntroWrapper>

    )
}

export default IntroSection