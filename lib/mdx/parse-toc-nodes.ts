import visit from 'unist-util-visit';

import { SearchMap, ParentNode, Node, TableOfContents } from './types';

const LIST = 'list';
const LIST_ITEM = 'listItem';
const PARAGRAPH = 'paragraph';
const LINK = 'link';
const TEXT = 'text';

const getItems = (
  node: ParentNode,
  current: TableOfContents,
): TableOfContents => {
  if (!node) {
    return {};
  } else if (node.type === `paragraph`) {
    visit(node, (item) => {
      if (item.type === `link`) {
        current.url = item.url as string;
      }
      if (item.type === `text`) {
        current.title = item.value as string;
      }
    });
    return current;
  } else {
    if (node.type === `list`) {
      current.items = node?.children?.map((i) => getItems(i, {}));
      return current;
    } else if (node.type === `listItem`) {
      const heading = getItems((node?.children ?? [])[0], {});
      if (node?.children && node.children.length > 1) {
        getItems(node.children[1], heading);
      }
      return heading;
    }
  }
  return {};
};

// Insert a `node` into a `parent`.
const insert = (node: Node, parent: ParentNode) => {
  const children = parent.children ?? [];
  const length = children?.length ?? 0;
  const last = children[length - 1];
  let item: ParentNode;

  if (node.depth === 1) {
    item = listItem();

    if (item.children) {
      item.children.push({
        type: PARAGRAPH,
        children: [
          {
            type: LINK,
            title: null,
            url: `#${node.id}`,
            children: [{ type: TEXT, value: node.value }],
          },
        ],
      });

      children.push(item);
    }
  } else if (last && last.type === LIST_ITEM) {
    insert(node, last);
  } else if (last && last.type === LIST) {
    if (node.depth) node.depth--;

    insert(node, last);
  } else if (parent.type === LIST) {
    item = listItem();

    insert(node, item);

    children.push(item);
  } else {
    item = list();
    if (node.depth) node.depth--;

    insert(node, item);

    children.push(item);
  }
};

// Create a list.
const list = (): ParentNode => ({ type: LIST, children: [] });

// Create a list item.
const listItem = (): ParentNode => ({
  type: LIST_ITEM,
  children: [],
});

// Transform a list of heading objects to a markdown list.
const parseTocNodes = (map: SearchMap[]) => {
  let minDepth = Infinity;
  let index = -1;
  const length = map.length;

  // Find minimum depth.
  while (++index < length) {
    if (map[index].depth < minDepth) {
      minDepth = map[index].depth;
    }
  }

  // Normalize depth.
  index = -1;

  while (++index < length) {
    map[index].depth -= minDepth - 1;
  }

  // Construct the main list.
  const table = list();

  // Add TOC to list.
  index = -1;

  while (++index < length) {
    insert(map[index], table);
  }

  return getItems(table, {});
};

export default parseTocNodes;
