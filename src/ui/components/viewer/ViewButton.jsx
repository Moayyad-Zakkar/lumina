import React from 'react';
import styled from 'styled-components';

const ViewButton = ({
  isActive,
  activeIcon,
  disabledIcon,
  name,
  viewChanger,
}) => {
  if (isActive) {
    return (
      <ActiveOption>
        <ViewIcon src={activeIcon} />
        <ViewLabel>{name}</ViewLabel>
      </ActiveOption>
    );
  } else {
    return (
      <InActiveOption onClick={() => viewChanger(name)}>
        <ViewIcon src={disabledIcon} />
        <ViewLabel>{name}</ViewLabel>
      </InActiveOption>
    );
  }
};

const ViewIcon = styled.img`
  width: 43px;
  height: 40px;
  display: block;
  @media (max-width: 570px) {
    width: 35px;
  }
`;

const ViewLabel = styled.p`
  font-size: 14px;
  color: #324858;
  font-weight: bold;
  margin: 0;
`;

const InActiveOption = styled.div`
  width: 95px;
  height: 95px;
  border-radius: 10px;
  margin-left: 0.4vw;
  margin-right: 0.4vw;
  cursor: pointer;
  opacity: 0.5;
  z-index: 1020;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  justify-content: center;
  @media (max-width: 768px) {
    width: 15vw;
    height: 15vw;
  }
`;
const ActiveOption = styled.div`
  width: 95px;
  height: 95px;
  border-radius: 10px;
  margin-left: 0.4vw;
  margin-right: 0.4vw;
  background-color: #e0f0f8;
  z-index: 1020;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  justify-content: center;
  @media (max-width: 768px) {
    width: 15vw;
    height: 15vw;
  }
`;

export default ViewButton;
