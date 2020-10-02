export const documentFilesBasePath = `${process.cwd()}/content/`;
export const isPostFileRegex = /docs\.(mdx|md)$/g;
export const pathRegex = /([^\/]*)(.*)\/docs\.(mdx|md)$/g;
export const orderRegex = /.*\/([0-9+]+)\.[^\/]*\/docs\.(mdx|md)$/g;
export const orderPartRefex = /\/([0-9+]+)\./g;
export const imageUrls = /(\!\[.*?\]\()(\S*?)(?=\))/g;

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
  contentNavStructure: NavigationArticle[];
  currentPagesContent?: MdxRenderedToString;
}

export const getNavigationItems = (
  allItems: Omit<NavigationArticle, 'children'>[],
): NavigationArticle[] => {
  const topLevelArticles = allItems.filter((article) => article.level === 1);
  const secondLevelArticles = allItems.filter((article) => article.level === 2);
  const thirdLevelArticles = allItems.filter((article) => article.level === 3);

  const hydrateSecondTierWithChildren = (
    secondLevelArticle: BaseNavigationArticle,
  ): SecondTierNavigationArticle => {
    const filteredThirdLevelChildren = thirdLevelArticles
      .filter(
        (thirdLevelArticle) =>
          thirdLevelArticle.parentSlug === secondLevelArticle.slug,
      )
      .sort((article1, article2) => article1.order - article2.order);
    return { ...secondLevelArticle, children: filteredThirdLevelChildren };
  };

  return topLevelArticles.map((topLevelArticle) => {
    return Object.assign(topLevelArticle, {
      children: secondLevelArticles
        .filter(
          (secondLevelArticle) =>
            secondLevelArticle.parentSlug === topLevelArticle.slug,
        )
        .map((filteredSecondLevelArticles) =>
          hydrateSecondTierWithChildren(filteredSecondLevelArticles),
        )
        .sort((article1, article2) => article1.order - article2.order),
    });
  });
};

export const parseRelativeLinks = (
  relativePathLinks: string[],
  imageLink: string,
) => {
  let revisedImageLink = imageLink;
  // check and handle relative links
  imageLink.split('/').some((link, index) => {
    // if the first link is a .. then path is relative
    if (index === 0 || link === '..') {
      // if relative path is at root then image link is invalid
      if (relativePathLinks.length === 0) {
        throw new Error(
          `relative path from image link in docs markdown in ${relativePathLinks.join(
            '/',
          )} is outside the content directory`,
        );
      }
      // remove last path from prefix
      relativePathLinks.pop();
      // remove relative path "../"
      revisedImageLink = revisedImageLink.substring(3);
      // return false to iterator continues to next directory in link
      return false;
    }
    return true;
  });

  return revisedImageLink;
};

export const replaceLinkInContent = (
  imageLink: string,
  revisedImageLink: string,
  relativePathLinks: string[],
  content: string,
) => {
  const revisedRelativeFilePath = [...relativePathLinks, revisedImageLink].join(
    '/',
  );
  const imageRegex = new RegExp(imageLink, 'g');
  return content.replace(imageRegex, `${revisedRelativeFilePath}`);
};

export const preToCodeBlock = (preProps: any) => {
  if (
    // children is code element
    preProps.children &&
    // code props
    preProps.children.props &&
    // if children is actually a <code>
    preProps.children.props.mdxType === 'code'
  ) {
    // we have a <pre><code> situation
    const {
      children: codeString,
      className = '',
      ...props
    } = preProps.children.props;

    const match = className.match(/language-([\0-\uFFFF]*)/);

    return {
      codeString: codeString.trim(),
      className,
      language: match != null ? match[1] : '',
      ...props,
    };
  }
  return undefined;
};
