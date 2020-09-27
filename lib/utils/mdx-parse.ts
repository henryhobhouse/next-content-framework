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

// export const addRelativeImageLinks = (
//   content: string,
//   relativePath: string,
// ) => {
//   const filesToUpdate: string[] = [];
//   let result;
//   let newContent = '';
//   console.log('here');
//   const regCheck = new RegExp(imageUrls);
//   while ((result = regCheck.exec(content)) !== null) {
//     console.log(result[2]);
//     if (filesToUpdate.includes(result[2])) break;
//     if (result[2]) filesToUpdate.push(result[2]);
//   }
//   filesToUpdate.forEach((fileName) => {
//     if (fileName.startsWith('/')) fileName.replace('/', '');
//     newContent = content.replace(
//       fileName,
//       `content/${relativePath}${fileName}`,
//     );
//   });
//   console.log(newContent);
//   return content;
// };
