import React, { useState } from 'react'
import styled from 'styled-components'
import eyeActive from '../assets/imgs/views/eye-active.svg';
import eyedisable from '../assets/imgs/views/eye-inactive.svg';




const EyeIcon = () => {
    const [active,setActive] = useState(true)


    if (active) {
        return  <Eye src={eyeActive} alt="active" onClick={() => {
            setActive(false)
        }} />
    } else {
        return  <Eye src={eyedisable} alt="active" onClick={() => {
            setActive(true)
        }} />
    }
}


const Eye = styled.img`
    cursor: pointer;
`


export default EyeIcon;