import React from 'react';
import styled from 'styled-components';
import FileUploader from './FileUploader';
import SliceSelector from './SliceSelector';
import ContourEditorToggle from './ContourEditorToggle';
import ImageViewer from './ImageViewer';
import SaveButton from './SaveButton';

const Container = styled.div`
  background-color: #2d2d2d;
  color: white;
  min-height: 100vh;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.h1`
  margin-bottom: 20px;
`;

const MainContainer = () => {
  return (
    <Container>
      <Title>Обработка снимков КТ печени</Title>
      <FileUploader />
      <SliceSelector />
      <ContourEditorToggle />
      <ImageViewer />
      <SaveButton />
    </Container>
  );
};

export default MainContainer;
