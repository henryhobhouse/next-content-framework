import {
  BaseNavigationArticle,
  NavigationArticle,
  SecondTierNavigationArticle,
} from '../../next-static-server/types';

const parseFlatNavigationItems = (
  allItems: Omit<NavigationArticle, 'children'>[],
): NavigationArticle[] => {
  const topLevelArticles = allItems
    .filter((article) => article.level === 1)
    .sort((art1, art2) => art1.order - art2.order);
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

  return topLevelArticles.map((topLevelArticle) =>
    Object.assign(topLevelArticle, {
      children: secondLevelArticles
        .filter(
          (secondLevelArticle) =>
            secondLevelArticle.parentSlug === topLevelArticle.slug,
        )
        .map((filteredSecondLevelArticles) =>
          hydrateSecondTierWithChildren(filteredSecondLevelArticles),
        )
        .sort((article1, article2) => article1.order - article2.order),
    }),
  );
};

export default parseFlatNavigationItems;
