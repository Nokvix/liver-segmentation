import React, { useState } from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  width: 60%;
  margin: 20px 0;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
`;

const Range = styled.input`
  width: 100%;
`;

const SliceSelector = () => {
  const [slice, setSlice] = useState(62);

  return (
    <Wrapper>
      <Label>Выберите срез</Label>
      <Range 
        type="range" 
        min="0" 
        max="152" 
        value={slice} 
        onChange={(e) => setSlice(e.target.value)} 
      />
    </Wrapper>
  );
};

export default SliceSelector;
