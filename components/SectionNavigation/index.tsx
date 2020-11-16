import isEmpty from 'lodash/isEmpty';
import React, { FC } from 'react';

import ChildNavigationArticle from './ChildNavigationItem';
import {
  NavigationSection,
  SectionItems,
  SectionTitle,
  SectionWrapper,
} from './section-navigation.sc';

import { NavigationArticle } from 'lib/page-mdx/types';

const SectionNavigation: FC<{ items: NavigationArticle[] }> = ({ items }) => (
  <SectionWrapper>
    {items.map((item, idx) => (
      <NavigationSection key={idx}>
        <SectionTitle title={item.title ?? ''}>{item.title}</SectionTitle>
        {!isEmpty(item.children) ? (
          <SectionItems>
            {item.children.map((childItem, idx) => (
              <ChildNavigationArticle key={idx} item={childItem} />
            ))}
          </SectionItems>
        ) : null}
      </NavigationSection>
    ))}
  </SectionWrapper>
);

export default SectionNavigation;
