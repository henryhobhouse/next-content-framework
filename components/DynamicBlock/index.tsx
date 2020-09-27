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
            <b>TRAY POTENTIAL:</b> Tray.io is extremely flexible. By design
            there is no fixed way of working with it - you can pull whatever
            data you need from other services and work with it using our core
            and helper connectors. This demo which follows shows only one
            possible way of working with Tray.io and the {connectorName}{' '}
            connector. Once you&apos;ve finished working through this example
            please see our{' '}
            <Link href={'/platform/working-with-data/intro-to-data-jsonpaths/'}>
              Introduction to working with data and jsonpaths
            </Link>{' '}
            page and{' '}
            <Link href={'/platform/working-with-data/basic-data-guide/'}>
              Data Guide
            </Link>{' '}
            for more details.
          </p>
        ) : (
          <div style={{ color: 'red' }}>
            YOU&apos;RE MISSING YOUR CONNECTOR NAME!!! PLEASE UPDATE DYNAMIC
            BLOCK ASAP!!!{' '}
          </div>
        );
      case 'json-paths':
        return (
          <p>
            <b>JSONPATHS</b>: For more information on what jsonpaths are and how
            to use jsonpaths with Tray.io, please see our{' '}
            <Link href={'/platform/working-with-data/intro-to-data-jsonpaths/'}>
              Intro
            </Link>{' '}
            page and{' '}
            <Link href={'/platform/working-with-data/basic-data-guide/'}>
              Data Guide
            </Link>{' '}
            for more details.
          </p>
        );
      case 'list-helper':
        return (
          <p>
            <b>LIST HELPER</b>: This is just one example of how the List Helper
            can be utilised. For more ways and uses regarding the{' '}
            <Link href={'/platform/connectors/docs/helpers/list-helper/'}>
              List helper
            </Link>{' '}
            connector, please see the main docs page for more details.
          </p>
        );
      case 'interpolation':
        return (
          <p>
            <b>INTERPOLATION</b>: When you wish to include JSON generated data
            within another input/ output/ result, use our Interpolation method
            as described{' '}
            <Link
              href={
                '/platform/standard-best-practices/managing-data/manipulating-data-part-2/'
              }
            >
              here
            </Link>
            .
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
          <p>
            <b>EXTRA AUTHS</b>: In order to complete this workflow, you will
            also need to be authenticated with the{' '}
            <Link
              href={`/platform/connectors/docs/service/${connectorPathName}`}
            >
              {connectorName}
            </Link>{' '}
            connector.
          </p>
        ) : (
          <div style={{ color: 'red' }}>
            YOU&apos;RE MISSING A PROP! PLEASE UPDATE DYNAMIC BLOCK AND MAKE
            SURE YOU HAVE NAME AND PATHNAME{' '}
          </div>
        );
      case 'webhooks':
        return connectorName ? (
          <p>
            <b>WEBHOOKS</b>: As this uses a webhook as its operation type, you
            will also need to integrate it with your{' '}
            {connectorName ? ` ${connectorName}` : 'this'} account, in order to
            complete the authentication process.
          </p>
        ) : (
          <div style={{ color: 'red' }}>
            YOU&apos;RE MISSING YOUR CONNECTOR NAME!!! PLEASE UPDATE DYNAMIC
            BLOCK ASAP!!!{' '}
          </div>
        );
      case 'connector-snake':
        return (
          <p>
            <b>CONNECTOR-SNAKE</b>: The simplest and easiest way to generate
            your jsonpaths is to use our feature called the{' '}
            <Link href="platform/working-with-data/jsonpath-shortcuts/">
              Connector-snake
            </Link>
            . Please see the main page for more details.
          </p>
        );
      default:
    }
  };
  return <Highlight>{textType(type)}</Highlight>;
};

export default DynamicBlock;
