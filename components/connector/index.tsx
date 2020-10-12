import Link from 'next/link';
import React, { FC, HTMLAttributes } from 'react';

import styles from './connector.module.scss';

import withStyles, { CNFunction } from 'lib/hocs/with-styles';

export function getConnectorIcon(data: Record<string, string>) {
  if (data?.streamlineIcon) {
    return `https://tray.io/streamline-icons/${data.streamlineIcon}.svg#Outline_Icons`;
  }
  if (data?.imageIcon) {
    return data?.imageIcon;
  }
  return '';
}

interface Props extends Omit<HTMLAttributes<HTMLAnchorElement>, 'href'> {
  cn: CNFunction;
  data: Record<string, string>;
  className?: string;
  connectorSection?: string;
  slug: string;
}

const Icon: FC<{ data: Record<string, string> }> = ({ data }) => {
  const iconSrc = getConnectorIcon(data);
  if (iconSrc) {
    return <img src={iconSrc} alt="" />;
  }
  return null;
};

const Connector: FC<Props> = ({
  cn,
  data,
  className,
  connectorSection,
  slug,
  ...rest
}) => (
  <Link href={slug}>
    <a
      className={cn('connector', className, {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        [`${connectorSection}`]: true,
      })}
      {...rest}
    >
      <div className={cn('icon')}>
        <Icon data={data as Record<string, string>} />
      </div>
      <header className={cn('title')}>
        <span>{data?.title}</span>
      </header>
    </a>
  </Link>
);

export default withStyles(styles)(Connector);
