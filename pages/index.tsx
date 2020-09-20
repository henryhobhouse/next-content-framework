import React from 'react';
import styled from 'styled-components';

import NavHeader from '../components/NavHeader';

const Wrapper = styled.div`
  box-sizing: border-box;
  min-height: 100vh;
  min-width: 768px;
  position: relative;
  padding-top: 90px;
  display: flex;
  flex-direction: column;
`;

const HeaderElement = styled.div`
  left: 0;
  right: 0;
  top: 0;
  position: fixed;
`;

const Home = () => (
  <Wrapper>
    <HeaderElement>
      <NavHeader />
    </HeaderElement>
    Hello World
  </Wrapper>
);

export default Home;
