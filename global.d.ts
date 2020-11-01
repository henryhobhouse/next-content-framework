declare module 'remark-unwrap-images';
declare module 'rehype-autolink-headings';
declare module 'rehype-slug';
declare module '@mdx-js/mdx';
declare module 'unist-util-is';
declare module 'unist-util-visit';
declare module 'uuid/v5';

declare module 'next-mdx-remote/render-to-string' {
  function renderToString(
    source: string,
    {
      components,
      mdxOptions,
      scope,
    }?: {
      components?: Record<string, unknown>;
      mdxOptions?: Record<string, unknown>;
      scope?: Record<string, unknown>;
    },
  ): {
    compiledSource: string;
    renderedOutput: string;
    scope: Record<string, unknown>;
  };
  export default renderToString;
}
declare module 'next-mdx-remote/hydrate' {
  function hydrate(
    source: {
      compiledSource: string;
      renderedOutput: string;
      scope: Record<string, unknown>;
    },
    {
      components,
    }?: {
      components?: Record<string, unknown>;
    },
  ): string;
  export default hydrate;
}
