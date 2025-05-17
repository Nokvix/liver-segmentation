import React from 'react';
import styled from 'styled-components';

const UploadBox = styled.div`
  border: 2px dashed #aaa;
  border-radius: 10px;
  padding: 20px;
  margin: 20px 0;
  width: 60%;
  text-align: center;
`;

const FileUploader = () => {
  return (
    <UploadBox>
      Загружен файл: liver_0.nii
    </UploadBox>
  );
};

export default FileUploader;
