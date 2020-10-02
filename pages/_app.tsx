import { AppProps } from 'next/app';
import React from 'react';
import styled from 'styled-components';

import NavHeader from '../components/NavHeader';
import CurrentRouteProvider from '../lib/context/current-route';

const Wrapper = styled.div`
  box-sizing: border-box;
  min-height: 100vh;
  min-width: 768px;
  position: relative;
  padding-top: 90px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const HeaderElement = styled.div`
  z-index: 500;
  left: 0;
  right: 0;
  top: 0;
  position: fixed;
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  width: 100%;
  display: flex;
  padding: 60px;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
`;

const MyApp = ({ Component, pageProps }: AppProps) => (
  <CurrentRouteProvider>
    <Wrapper>
      <HeaderElement>
        <NavHeader />
      </HeaderElement>
      <ContentWrapper>
        <Component {...pageProps} />
      </ContentWrapper>
    </Wrapper>
  </CurrentRouteProvider>
);

export default MyApp;
