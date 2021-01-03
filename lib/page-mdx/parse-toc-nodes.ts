import visit from 'unist-util-visit';

import { SearchMap, ParentNode, Node, TableOfContents } from './types';

const list = 'list';
const listItem = 'listItem';
const header = 'header';
const link = 'link';
const title = 'title';

// Create an empty node list.
const createEmptyList = (): ParentNode => ({ type: list, children: [] });

// Create an empty node list item.
const createEmptyListItem = (): ParentNode => ({
  type: listItem,
  children: [],
});

const createTocFromNodeList = (
  node: ParentNode,
  current: TableOfContents,
): TableOfContents => {
  if (!node) {
    return {};
  }

  if (node.type === header) {
    visit(node, (item: Node) => {
      if (item.type === link) {
        current.url = item.url as string;
      }
      if (item.type === title) {
        current.title = item.value as string;
      }
    });
    return current;
  }

  if (node.type === list) {
    current.items = node?.children?.map((i) => createTocFromNodeList(i, {}));
    return current;
  }

  if (node.type === listItem) {
    const heading = createTocFromNodeList((node?.children ?? [])[0], {});
    if (node?.children && node.children.length > 1) {
      createTocFromNodeList(node.children[1], heading);
    }
    return heading;
  }

  return {};
};

// Recursively iterate through the nodes and map according to hierarchy (node list -> children: node list item array -> child node list -> etc)
const recursiveMapNodesToList = (node: Node, parent: ParentNode) => {
  const children = parent.children ?? [];
  const length = children?.length ?? 0;
  const last = children[length - 1];
  let item: ParentNode;

  if (node.depth === 1) {
    item = createEmptyListItem();

    if (item.children) {
      item.children.push({
        type: header,
        children: [
          {
            type: link,
            title: null,
            url: `#${node.id}`,
            children: [{ type: title, value: node.value }],
          },
        ],
      });

      children.push(item);
    }
  } else if (last && last.type === listItem) {
    // if last item is a list item then simply populate using
    // recursiveMapNodesToList
    recursiveMapNodesToList(node, last);
  } else if (last && last.type === list) {
    // if list item is a list then populate but move node depth one
    // level up
    if (node.depth) node.depth--;
    recursiveMapNodesToList(node, last);
  } else if (parent.type === list) {
    // if not first or last of list in current depth then create
    // a new list item and populate using recursiveMapNodesToList
    item = createEmptyListItem();

    recursiveMapNodesToList(node, item);

    children.push(item);
  } else {
    // if not the first, or last item and parent is not a list item then assume item
    // should be a list and create a new list one level up (sibling of current list item)
    item = createEmptyList();
    if (node.depth) node.depth--;

    recursiveMapNodesToList(node, item);

    children.push(item);
  }
};

/**
 * Transform an array of heading objects to a hierarchical Toc Object. Logic inspired by Gatsby code
 * which transforms the TOC to the same format (and hence works with current presentation layer without any
 * changes)
 */
const parseTocNodes = (map: SearchMap[]) => {
  let minDepth = Infinity;
  let index = -1;
  const { length } = map;

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
  const hierarchicalNodeList = createEmptyList();

  index = -1;

  // Add the Table of contents to list.
  while (++index < length) {
    recursiveMapNodesToList(map[index], hierarchicalNodeList);
  }

  return createTocFromNodeList(hierarchicalNodeList, {});
};

export default parseTocNodes;
