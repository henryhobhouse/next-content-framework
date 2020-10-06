import githubSlugger from 'github-slugger';
import is from 'unist-util-is';
import visit from 'unist-util-visit';

import { Node, ParentNode, SearchMap } from './types';

// Get the text content of a node.
// Prefer the node’s plain-text fields, otherwise serialize its children,
// and if the given value is an array, serialize the nodes in it.
const valueToString = (node: Node | Node[]): string => {
  if (Array.isArray(node)) {
    return all(node);
  } else {
    return (
      (node?.value as string) ||
      (node?.alt as string) ||
      (node?.title as string) ||
      (node?.children && all(node.children as Node[])) ||
      ''
    );
  }
};

const all = (values: Node[]): string => {
  const result = [];
  const length = values.length;
  let index = -1;

  while (++index < length) {
    result[index] = valueToString(values[index]);
  }

  return result.join('');
};

const headingTitle = 'heading';

const searchNodes = (root: ParentNode, headingDepth: number) => {
  const maxDepth = headingDepth;
  const parents = root;
  const slugs = new githubSlugger();
  const map: SearchMap[] = [];

  slugs.reset();

  const onheading = (child: Node, _: number, parent?: ParentNode) => {
    const value = valueToString(child);
    const id = child?.data?.hProperties?.id;

    if (!is(parents, parent as any)) {
      return;
    }

    if (value && child?.depth && child.depth <= maxDepth) {
      map.push({
        depth: child.depth,
        value: value,
        id: slugs.slug(id || value),
      });
    }
  };

  // Visit all headings in `root`.  We `slug` all headings (to account for
  // duplicates), but only create a TOC from top-level headings.
  visit(root, headingTitle, onheading);

  return map;
};

export default searchNodes;
