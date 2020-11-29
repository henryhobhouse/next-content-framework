import { FC, memo } from 'react';

import useIntersectionTracker from '../../lib/hooks/use-intersection-tracker';

import {
  SectionItemsList,
  ListItem,
  SubInstrumentedAnchor,
  Row,
  UnorderedList,
  Anchor,
} from './desktopTableOfContents.sc';

import { TableOfContents } from 'lib/page-mdx/types';

interface SectionItemsProps {
  items: TableOfContents[];
  activeSectionId?: string;
}

const SectionItems = ({ items = [], activeSectionId }: SectionItemsProps) => {
  if (items.length < 1) {
    return null;
  }

  return (
    <SectionItemsList>
      {items.map((section, index) => {
        const active = section && section.url === `#${activeSectionId}`;
        const url = section && section.url;
        return (
          <ListItem key={index}>
            <Row>
              <SubInstrumentedAnchor
                active={active}
                href={url ?? ''}
                title={section.title}
              >
                {section.title}
              </SubInstrumentedAnchor>
            </Row>
          </ListItem>
        );
      })}
    </SectionItemsList>
  );
};

const DesktopTableOfContents: FC<{ tableOfContents: TableOfContents }> = ({
  tableOfContents = {},
}) => {
  const { items } = tableOfContents;

  const { activeSectionId } = useIntersectionTracker(
    '#article-content h2, #article-content h3',
  );

  if (!items) {
    return null;
  }

  const sectionList = items.filter(
    (section) => section && section.url !== undefined,
  );

  if (sectionList.length < 1) {
    return null;
  }

  return (
    <UnorderedList>
      {sectionList.map((section, index) => {
        const active = `#${activeSectionId}` === section.url;

        return (
          <ListItem key={`${section.url}-${index}`}>
            <Row>
              <Anchor
                active={active}
                href={section.url ?? ''}
                title={section.title}
              >
                {section.title}
              </Anchor>
            </Row>
            <SectionItems
              items={section.items ?? []}
              activeSectionId={activeSectionId}
            />
          </ListItem>
        );
      })}
    </UnorderedList>
  );
};

export default memo(DesktopTableOfContents);
