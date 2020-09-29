import Link from 'next/link';
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
  align-content: center;
  align-items: center;
  max-width: 1170px;
  width: 100%;
  padding-right: 30px;
`;

const ContentLinks = styled.a`
  padding-left: 30px;
  font-weight: 600;
  cursor: pointer;
  font-size: 18px;
  color: darkslategray;
  user-select: none;

  &:hover {
    color: black;
  }
`;

const HeaderLink = styled.a`
  padding-left: 30px;
`;

/**
 * Fixed header bar at the top of the page
 */
const NavHeader: FC = () => (
  <Header>
    <ContentContainer>
      <Link href="/">
        <HeaderLink>
          <h1>Test Markdown Build</h1>
        </HeaderLink>
      </Link>
      <div>
        <Link href="/platform/top-two/mid-one" passHref>
          <ContentLinks>Platform</ContentLinks>
        </Link>
        <Link href="/platform/top-one" passHref>
          <ContentLinks>Embedded</ContentLinks>
        </Link>
      </div>
    </ContentContainer>
  </Header>
);

export default NavHeader;
