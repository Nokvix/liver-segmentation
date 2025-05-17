import React, { useState } from 'react';
import styled from 'styled-components';

const ToggleWrapper = styled.div`
  margin: 20px 0;
`;

const SwitchLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ContourEditorToggle = () => {
  const [enabled, setEnabled] = useState(true);

  return (
    <ToggleWrapper>
      <SwitchLabel>
        Редактировать контур
        <input 
          type="checkbox" 
          checked={enabled} 
          onChange={() => setEnabled(!enabled)} 
        />
      </SwitchLabel>
    </ToggleWrapper>
  );
};

export default ContourEditorToggle;
