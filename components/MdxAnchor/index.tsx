import Link from 'next/link';
import React, { AnchorHTMLAttributes, FC } from 'react';

const MdxAnchor: FC<AnchorHTMLAttributes<HTMLAnchorElement>> = ({
  href,
  children,
  ...rest
}) => {
  const isExternalUrl = href?.startsWith('http');
  const isHeaderLink = href?.startsWith('#');
  return isExternalUrl || isHeaderLink ? (
    <a href={href} {...rest}>
      {children}
    </a>
  ) : (
    <Link href={href ?? ''}>
      <a {...rest}>{children}</a>
    </Link>
  );
};

export default MdxAnchor;
