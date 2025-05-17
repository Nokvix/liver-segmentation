import React from 'react';
import styled from 'styled-components';

const ImageWrapper = styled.div`
  margin: 20px 0;
  border: 2px solid #fff;
  padding: 10px;
  border-radius: 10px;
`;

const Img = styled.img`
  max-width: 100%;
  border-radius: 5px;
`;

const ImageViewer = () => {
  return (
    <ImageWrapper>
      <Img src="/images/275accd3-f6ac-481d-91a6-8c4e921b9e4e.png" alt="CT Slice" />
    </ImageWrapper>
  );
};

export default ImageViewer;
