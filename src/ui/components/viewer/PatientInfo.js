import React from 'react'
import styled from 'styled-components'
import sheetIcon from '../assets/imgs/sheet.svg'



const PatientInfo = ({name, caseNum, patientSheet}) => {
    return (
        <Flex>
         <PatientInfoText>Patient Name: <PatientInfoTextSpan>{name}</PatientInfoTextSpan></PatientInfoText>   
         <PatientInfoText>Case Number: <PatientInfoTextSpan>{caseNum}</PatientInfoTextSpan></PatientInfoText>    
         {patientSheet ?
                  <FlexRow href="/information sheet.pdf">
                  <ViewIcon src={sheetIcon} /> 
                  <PatientInfoText>Download <PatientInfoTextSpan>Information Sheet</PatientInfoTextSpan> (Arabic)</PatientInfoText>
                  </FlexRow>
                  : null
        }

        </Flex>
    )
}

const Flex = styled.div`
display:flex;
flex-direction: column;
text-align: center; 
align-items: center;
justify-content: center;
margin: 0 20px;
`
const FlexRow = styled.a`
display:flex;
flex-direction: Row;
cursor: pointer;
text-align: center; 
align-items: center;
justify-content: center;
filter: invert(47%) sepia(72%) saturate(2534%) hue-rotate(165deg) brightness(102%) contrast(101%);
/* border: 1px solid #fff; */
border-radius: 5px;
padding: 0 5px;
margin: 20px 0 0px 0;
text-decoration: none;
`

const PatientInfoText = styled.p`
    /* color: #00adef;
    font-weight: bold; */
    margin: 0;
    font-size: 1rem;
`

const PatientInfoTextSpan = styled.span`
    color: #00adef;
    font-weight: bold;
    margin: 0;
    font-size: 1rem;
`

const ViewIcon = styled.img`
    width: 43px;
    height: 40px;
    display: block;
    margin: 10px 0;
`

export default PatientInfo;