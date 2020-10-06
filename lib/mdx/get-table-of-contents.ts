import mdx from '@mdx-js/mdx';

import searchNodes from './search-nodes';
import { ParentNode, TableOfContents } from './types';

const maxDepthOfToc = 3;

const getTableOfContents = (mdxContent: string): TableOfContents => {
  const compiler = mdx.createMdxAstCompiler({ remarkPlugins: [] });
  // get MarkDown as AST as much easier to parse than pure HTML
  const mdAst: ParentNode = compiler.parse(mdxContent);
  const something = searchNodes(mdAst, maxDepthOfToc);

  console.log(something);
  return {};
};

export default getTableOfContents;
