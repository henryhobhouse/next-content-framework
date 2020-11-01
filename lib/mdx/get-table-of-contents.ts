import mdx from '@mdx-js/mdx';

import parseTocNodes from './parse-toc-nodes';
import searchNodes from './search-nodes';
import { ParentNode, SearchMap, TableOfContents } from './types';

const smallestHeaderSizeOfToc = 3;

const getTableOfContents = (mdxContent: string): TableOfContents => {
  const compiler = mdx.createMdxAstCompiler({ remarkPlugins: [] });
  // get MarkDown as AST as much easier to parse than pure HTML
  const mdAst: ParentNode = compiler.parse(mdxContent);
  // create array of header nodes from AST
  const headerNodes = searchNodes(mdAst, smallestHeaderSizeOfToc);
  // parse header nodes in to TOC format (heirarchal)
  const tableOfContents = parseTocNodes(headerNodes as SearchMap[]);

  return tableOfContents;
};

export default getTableOfContents;
