import React from 'react'
import styled from 'styled-components'


const Tabs = ({currentTab, tabChanger}) => {
    if (currentTab === 'videos') {
        return (
            <Flex>
            <OptionActive >Video Sequence</OptionActive> 
            <Option onClick={() => {tabChanger('images')}}>Before & After</Option>
            </Flex>
        )
    } else if (currentTab === 'images') {
        return (
        <Flex>
        <Option onClick={() =>{tabChanger('videos')}}>Video Sequence</Option> 
        <OptionActive>Before & After</OptionActive>
        </Flex>
        )
    }
}

const Option = styled.div`
    color: #00adef;
    font-weight: bold;
    font-size: 1rem;
    cursor: pointer;
    padding: 10px;
    opacity: .5;
    vertical-align: middle;
`
const OptionActive = styled.div`
    color: #00adef;
    font-weight: bold;
    font-size: 1rem;
    padding: 10px;
    background-color: #e0f0f8;
    border-radius: 20px;
    vertical-align: middle;
`

const Flex = styled.div`
border-radius: 20px;
border: 1px solid #00adef;
display: grid;
grid-template-columns: 1fr 1fr;
margin-bottom: 2rem;
margin-top: 2rem;
/* padding: 10px 0; */
`

export default Tabs;