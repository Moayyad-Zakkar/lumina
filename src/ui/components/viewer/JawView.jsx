import React from 'react';
import styled from 'styled-components';

const JawView = ({ name, jawImg, upperCount, lowerCount }) => {
  return (
    <Flex>
      {upperCount ? (
        <ViewLabel>
          <ViewLabelSpan>{upperCount}</ViewLabelSpan> {name}{' '}
        </ViewLabel>
      ) : null}
      {lowerCount ? (
        <ViewLabel>
          <ViewLabelSpan>{lowerCount}</ViewLabelSpan> {name}{' '}
        </ViewLabel>
      ) : null}
      <ViewIcon src={jawImg} />
      {/* <EyeIcon /> */}
    </Flex>
  );
};

const Flex = styled.div`
  display: flex;
  flex-direction: column;
  text-align: center;
  align-items: center;
  justify-content: center;
  margin: 0 20px;
`;

const ViewLabel = styled.p`
  color: #212529;
  font-weight: 600;
  margin: 0;
  font-size: 1rem;
`;

const ViewLabelSpan = styled.span`
  color: #00adef;
  font-weight: bold;
  margin: 0;
  font-size: 1rem;
`;

// const ViewLabel = styled.p`
// font-size: 14px;
//     color: #324858;
//     font-weight: bold;
// `

const ViewIcon = styled.img`
  width: 43px;
  height: 40px;
  display: block;
`;

export default JawView;
