import React from 'react';
import styled from 'styled-components';

const Button = styled.button`
  margin-top: 20px;
  padding: 12px 30px;
  background-color: #1E1E1E;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #0056b3;
  }
`;

const SaveButton = () => {
  return (
    <Button>Сохранить изображение</Button>
  );
};

export default SaveButton;
