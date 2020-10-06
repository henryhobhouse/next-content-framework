interface Data {
  hProperties?: {
    id?: string;
  };
  [key: string]: unknown;
}

export interface ParentNode extends Node {
  /**
   * List representing the children of a node.
   */
  children?: Node[];
}

export interface Point {
  /**
   * Line in a source file (1-indexed integer).
   */
  line: number;

  /**
   * Column in a source file (1-indexed integer).
   */
  column: number;
  /**
   * Character in a source file (0-indexed integer).
   */
  offset?: number;
}

interface Position {
  /**
   * Place of the first character of the parsed source region.
   */
  start: Point;

  /**
   * Place of the first character after the parsed source region.
   */
  end: Point;

  /**
   * Start column at each index (plus start line) in the source region,
   * for elements that span multiple lines.
   */
  indent?: number[];
}

export interface Node {
  /**
   * The constiant of a node.
   */
  type: string;

  /**
   * Information from the ecosystem.
   */
  data?: Data;

  value?: string;

  id?: string;

  /**
   * Location of a node in a source document.
   * Must not be present if a node is generated.
   */
  position?: Position;

  depth?: number;

  [key: string]: unknown;
}

export interface SearchMap extends ParentNode {
  value: string;
  id: string;
  depth: number;
}

export interface BaseNavigationArticle {
  level: number;
  order: number;
  slug: string;
  title?: string | null;
  parentSlug: string;
}

export interface SecondTierNavigationArticle extends BaseNavigationArticle {
  children: BaseNavigationArticle[];
}

export interface NavigationArticle extends BaseNavigationArticle {
  children: SecondTierNavigationArticle[];
}

export interface StaticPathParams {
  params: {
    slug: string[];
  };
}

export interface MdxRenderedToString {
  compiledSource: string;
  renderedOutput: string;
  scope: Record<string, unknown>;
}

export interface DocumentPostProps {
  navigationStructure: NavigationArticle[];
  content?: MdxRenderedToString;
  frontmatter?: Record<string, string>;
  tableOfContents: TableOfContents;
}

export interface TableOfContents {
  title?: string;
  url?: string;
  items?: TableOfContents[];
}

export type Resolve = (...pathSegment: string[]) => string;
