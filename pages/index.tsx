import Link from 'next/link';
import React from 'react';
import styled from 'styled-components';

const LinkWrapper = styled.div`
  display: flex;
  flex-direction: column;
  > * {
    padding-bottom: 30px;
  }
`;

const Home = () => {
  return (
    <LinkWrapper>
      <Link href="/platform/top-two/mid-one">
        <a>Platform</a>
      </Link>
      <Link href="/platform/top-two/mid-one">
        <a>Embedded</a>
      </Link>
    </LinkWrapper>
  );
};

export default Home;
