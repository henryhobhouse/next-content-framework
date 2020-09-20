import React, { FC } from 'react';
import styled from 'styled-components';

const Header = styled.div`
  justify-content: center;
  align-items: center;
  min-width: 480px;
  height: 90px;
  z-index: 100;
  background: #fff;
  box-shadow: 0 4px 8px 0 rgba(33, 43, 54, 0.1);
  display: flex;
`;

const ContentContainer = styled.div`
  display: flex;
  justify-content: space-between;
  max-width: 1170px;
  width: 100%;
`;

/**
 * Fixed header bar at the top of the page
 */
const NavHeader: FC = () => (
  <Header>
    <ContentContainer>
      <h1>Test Markdown Build</h1>
    </ContentContainer>
  </Header>
);

export default NavHeader;
