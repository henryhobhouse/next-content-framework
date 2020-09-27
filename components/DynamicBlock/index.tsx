import Link from 'next/link';
import React, { FC } from 'react';

import Highlight from '../Highlight';

interface Props {
  connectorName?: string;
  connectorPathName?: string;
  type?: string;
}

const DynamicBlock: FC<Props> = ({
  connectorName,
  type = 'potential',
  connectorPathName,
}) => {
  const textType = (textType: string) => {
    switch (textType) {
      case 'potential':
        return connectorName ? (
          <p>
            <b>Bay POTENTIAL:</b>
            <Link href={'/platform/'}>Introduction t</Link>
          </p>
        ) : (
          <div style={{ color: 'red' }}>AP!!! </div>
        );
      case 'json-paths':
        return <p>for more details.</p>;
      case 'list-helper':
        return <p>more details.</p>;
      case 'interpolation':
        return (
          <p>
            <Link href={'/platform/'}>here</Link>.
          </p>
        );
      case 'best-practices':
        return (
          <p>
            <b>BEST PRACTICES</b>: Whenever you do decide to create your own
            workflow, please make sure you take a look at our{' '}
            <Link
              href={
                '/platform/standard-best-practices/managing-data/intro-to-managing-data/'
              }
            >
              Managing data best practices
            </Link>{' '}
            guide.
          </p>
        );
      case 'extra-auths':
        return connectorName && connectorPathName ? (
          <p>also need to be authenticated with the</p>
        ) : (
          <div style={{ color: 'red' }}>PATHNAME </div>
        );
      case 'webhooks':
        return connectorName ? (
          <p>
            <b>WEBHOOKS</b>:
          </p>
        ) : (
          <div style={{ color: 'red' }}>ASAP!!! </div>
        );
      case 'connector-snake':
        return <p>feature called the </p>;
      default:
    }
  };
  return <Highlight>{textType(type)}</Highlight>;
};

export default DynamicBlock;
