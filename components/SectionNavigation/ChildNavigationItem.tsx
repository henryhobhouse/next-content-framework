import { faCaretRight } from '@fortawesome/free-solid-svg-icons';
import { AnimatePresence } from 'framer-motion';
import { isEmpty } from 'lodash-es';
import Link from 'next/link';
import React, { FC, memo, useContext, useEffect, useState } from 'react';

import { CurrentRouteContext } from '../../lib/context/current-route';
import { SecondTierNavigationArticle } from '../../lib/utils/mdx-parse';

import {
  IconWrapper,
  NavItem,
  NavItemChildren,
  NavItemHeaderWrapper,
  NavItemIcon,
  NavItemLink,
} from './section-navigation.sc';

interface ChildNavigationArticleProps {
  item: SecondTierNavigationArticle;
}

interface NavItemHeaderProps {
  item: SecondTierNavigationArticle;
  open: boolean;
  isSelected: boolean;
}

const animationTransistion = { duration: 0.2, ease: 'easeOut' };

const NavItemHeader: FC<NavItemHeaderProps> = ({ item, isSelected }) => {
  const hasChildren = !isEmpty(item.children);
  const icon = hasChildren ? (
    <IconWrapper
      variants={{
        open: { rotate: 90 },
        closed: { rotate: 0 },
      }}
      transition={animationTransistion}
    >
      <NavItemIcon icon={faCaretRight} $isSelected={isSelected} />
    </IconWrapper>
  ) : null;

  return (
    <Link href={item.slug}>
      <NavItemLink $isSelected={isSelected} title={item.title ?? ''}>
        <NavItemHeaderWrapper>
          {icon}
          {item.title}
        </NavItemHeaderWrapper>
      </NavItemLink>
    </Link>
  );
};

const ChildNavigationArticle: FC<ChildNavigationArticleProps> = ({ item }) => {
  const { currentRoute } = useContext(CurrentRouteContext);
  // this accounts for when page is parent in current path. It equally allows for path prefixs.
  const inPagesPathHierarchy = currentRoute.includes(
    item?.slug.replace(/\/$/, ''),
  );
  const [open, setOpen] = useState<boolean>(inPagesPathHierarchy);
  const hasChildren = !isEmpty(item.children);

  useEffect(() => {
    setOpen(inPagesPathHierarchy);
  }, [inPagesPathHierarchy]);

  return (
    <NavItem
      hasChildren={hasChildren}
      isSelected={inPagesPathHierarchy}
      initial={false}
      animate={open ? 'open' : 'closed'}
    >
      <NavItemHeader
        open={open}
        item={item}
        isSelected={inPagesPathHierarchy}
      />
      <AnimatePresence initial={false}>
        {open && hasChildren && (
          <NavItemChildren
            initial="closed"
            animate="open"
            exit="closed"
            variants={{
              open: { opacity: 1, height: 'auto' },
              closed: { opacity: 0, height: 0 },
            }}
            transition={animationTransistion}
            key={item.slug}
          >
            {item?.children.map((thirdLevelItem) => {
              const isSelected = currentRoute?.endsWith(
                thirdLevelItem.slug.replace(/\/$/, ''),
              );
              return thirdLevelItem.title ? (
                <NavItem
                  isSelected={isSelected}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  variants={{
                    open: {
                      y: 0,
                      opacity: 1,
                    },
                    closed: {
                      y: -20,
                      opacity: 0,
                    },
                  }}
                  transition={animationTransistion}
                  key={thirdLevelItem.slug}
                  isChild
                >
                  <Link href={thirdLevelItem.slug}>
                    <NavItemLink
                      $isSelected={isSelected}
                      title={thirdLevelItem.title}
                    >
                      {thirdLevelItem.title}
                    </NavItemLink>
                  </Link>
                </NavItem>
              ) : null;
            })}
          </NavItemChildren>
        )}
      </AnimatePresence>
    </NavItem>
  );
};

export default memo(ChildNavigationArticle);
