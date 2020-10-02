import { promises } from 'fs';
import { resolve } from 'path';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import matter from 'gray-matter';
import hydrate from 'next-mdx-remote/hydrate';
import renderToString from 'next-mdx-remote/render-to-string';
import React, { FC, HTMLAttributes } from 'react';
import remarkUnwrapImages from 'remark-unwrap-images';

import ArticleWrapper from 'components/ArticleWrapper';
import Code from 'components/Code';
import DynamicBlock from 'components/DynamicBlock';
import Highlight from 'components/Highlight';
import MdxAnchor from 'components/MdxAnchor';
import OptimisedImage from 'components/OptimisedImage';
import SectionNavigation from 'components/SectionNavigation';
import {
  documentFilesBasePath,
  DocumentPostProps,
  getNavigationItems,
  imageUrls,
  isPostFileRegex,
  MdxRenderedToString,
  NavigationArticle,
  orderPartRefex,
  orderRegex,
  parseRelativeLinks,
  pathRegex,
  preToCodeBlock,
  replaceLinkInContent,
  StaticPathParams,
} from 'lib/utils/mdx-parse';

const contentPagedir = 'platform';
const contentRouteDir = '/content';
const platformDocumentsPath = `${documentFilesBasePath}/${contentPagedir}`;

// components is its own object outside of render so that the references to
// components are stable
const components = {
  pre: (preProps: HTMLAttributes<HTMLPreElement>) => {
    const props = preToCodeBlock(preProps);
    // if there's a codeString and some props, we passed the test
    if (props) {
      return <Code {...props} />;
    }
    // it's possible to have a pre without a code in it
    return <pre {...preProps} />;
  },
};

const DocumentPost: FC<DocumentPostProps> = ({
  currentPagesContent,
  contentNavStructure,
}) => {
  // for client side rendering
  const content =
    currentPagesContent &&
    hydrate(currentPagesContent, {
      components: {
        img: OptimisedImage,
        a: MdxAnchor,
        DynamicBlock,
        Highlight,
        FontAwesomeIcon,
        ...components,
      },
    });

  return (
    <>
      <SectionNavigation items={contentNavStructure} />
      <ArticleWrapper>{content}</ArticleWrapper>
    </>
  );
};

const checkFileExists = async (filePath: string) => {
  try {
    await promises.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const getSlugs = async (directory: string) => {
  const paths: StaticPathParams[] = [];

  const parseDirectories = async (directory: string) => {
    const dirents = await promises.readdir(directory, {
      withFileTypes: true,
    });

    // assume only one post file per directory
    const postFile = dirents.find(
      (dirent) => !!dirent.name.match(isPostFileRegex),
    );

    if (postFile) {
      const markdownPath = resolve(directory, postFile.name);
      const relativePath = markdownPath.replace(documentFilesBasePath, '');
      pathRegex.lastIndex = 0;
      orderRegex.lastIndex = 0;
      const pathComponents = pathRegex.exec(relativePath);

      if (pathComponents) {
        const path = pathComponents[2];
        const localPath = path.replace(orderPartRefex, '/');

        paths.push({
          params: {
            slug: [...localPath.split('/').filter(Boolean)],
          },
        });
      }
    }
    await Promise.all(
      dirents.map(async (dirent) => {
        if (dirent.isDirectory()) {
          const directoryPath = resolve(directory, dirent.name);
          await parseDirectories(directoryPath);
        }
      }),
    );
  };
  await parseDirectories(directory);
  return paths;
};

const checkValidLink = async (
  imageLink: string,
  relativePath: string,
  imageLinkIsFile: boolean,
  linkPathIsRelative: boolean,
) => {
  if (linkPathIsRelative || imageLinkIsFile) {
    return checkFileExists(
      `${process.cwd()}${contentRouteDir}/${relativePath}/${imageLink}`,
    );
  }
  return checkFileExists(`${process.cwd()}${contentRouteDir}/${imageLink}`);
};

const addRelativeImageLinks = async (content: string, relativePath: string) => {
  const imageLinksToUpdate: string[] = [];
  let result: RegExpExecArray | null;

  // default newContent is just the content. i.e. all the links are absolute and don't need updating
  let newContent = content;
  const regCheck = new RegExp(imageUrls);

  // look for image links in content and each time find one add to fileNamesToUpdate
  while ((result = regCheck.exec(content)) !== null) {
    if (result[2]) imageLinksToUpdate.push(result[2]);
  }

  const nonDupedImageLinks = imageLinksToUpdate.filter((value, index, self) => {
    return self.indexOf(value) === index;
  });

  // iterate through image links to parse relative path
  await Promise.all(
    nonDupedImageLinks.map(async (imageLink) => {
      // remove any path prefixes (./ or /) from beginning of link
      const nonRelativeLink = imageLink.replace(/^(.\/|\/)/, '');
      const imageLinkDirectories = nonRelativeLink.split('/');
      const linkPathIsRelative = imageLinkDirectories.some(
        (link) => link === '..',
      );
      const imageLinkIsFile =
        !linkPathIsRelative && imageLinkDirectories.length === 1;

      const isValidLink = await checkValidLink(
        imageLink,
        relativePath,
        imageLinkIsFile,
        linkPathIsRelative,
      );

      if (linkPathIsRelative && isValidLink) {
        const relativePathLinks = relativePath.split('/');
        const revisedImageLink = parseRelativeLinks(
          relativePathLinks,
          imageLink,
        );
        newContent = replaceLinkInContent(
          imageLink,
          revisedImageLink,
          relativePathLinks,
          newContent,
        );
      }

      if (imageLinkIsFile && isValidLink) {
        newContent = replaceLinkInContent(
          imageLink,
          `${relativePath}/${nonRelativeLink}`,
          [],
          newContent,
        );
      }

      if (!isValidLink) {
        // eslint-disable-next-line no-console
        console.warn(
          `WARNING: The image "${imageLink}" referenced in "${relativePath}/docs.mdx|md" does not exist.`,
        );
        const links = newContent.match(imageUrls);
        const badLink = links?.find((link) => link.includes(imageLink));
        if (badLink) {
          newContent = newContent.replace(badLink, '');
        }
      }
    }),
  );

  // remove all comments
  newContent = newContent.replace(/\<\!\-\-.*\-\-\>/g, '');

  return newContent;
};

/**
 * Recurrively iterate through all markdown files in the in the content folder and parse the data
 * To include meta data in both frontmatter but equally ordering for the side navigation. As you cannot
 * use 'fs' outside of the same module as getStaticProps function call this, unfortunately, cannot be easily refactored
 * to smaller chucks. It definitely has room for improvement but will do in the future.
 */
const getNavigationArticles = async (
  currentSlugSections: string[],
): Promise<{
  contentNavStructure: NavigationArticle[];
  currentPagesContent?: MdxRenderedToString;
}> => {
  const flatArticles: Omit<NavigationArticle, 'children'>[] = [];
  let currentPagesContent: MdxRenderedToString | undefined;

  const parseDirectories = async (directory: string) => {
    const dirents = await await promises.readdir(directory, {
      withFileTypes: true,
    });
    // assume only one post file per directory
    const postFile = dirents.find(
      (dirent) => !!dirent.name.match(isPostFileRegex),
    );
    if (postFile) {
      const markdownPath = resolve(directory, postFile.name);
      const relativePath = markdownPath.replace(documentFilesBasePath, '');
      pathRegex.lastIndex = 0;
      orderRegex.lastIndex = 0;
      const pathComponents = pathRegex.exec(relativePath);
      const orderComponents = orderRegex.exec(relativePath);

      if (pathComponents) {
        const path = pathComponents[2];
        const localPath = path.replace(orderPartRefex, '/');
        const slug = `/${contentPagedir}${localPath}`;
        const level = (localPath && localPath.match(/\//g)?.length) || 1;
        const order = orderComponents ? parseInt(orderComponents[1]) : 0;
        const parentSlug = slug.replace(/\/[a-zA-Z0-9-]+$/, '');
        const markdownData = await promises.readFile(markdownPath, 'utf8');
        const { data, content } = matter(markdownData);

        const docTitle = data.menu_title || data.title;

        // if there is a document title than add it to the side navigation config
        if (docTitle) {
          flatArticles.push({
            title: docTitle,
            slug,
            level,
            order,
            parentSlug,
          });
        }

        if (slug === `/${contentPagedir}/${currentSlugSections.join('/')}`) {
          const relativePathToImages = relativePath.replace(
            /\/docs.(mdx|md)$/,
            '',
          );

          const transformedContent = await addRelativeImageLinks(
            content,
            relativePathToImages,
          );

          // for server side rendering
          currentPagesContent = await renderToString(transformedContent, {
            components: {
              img: OptimisedImage,
              a: MdxAnchor,
              DynamicBlock,
              Highlight,
              FontAwesomeIcon,
              ...components,
            },
            mdxOptions: {
              remarkPlugins: [remarkUnwrapImages],
            },
          });
        }
      }
    }
    await Promise.all(
      dirents.map(async (dirent) => {
        if (dirent.isDirectory()) {
          const directoryPath = resolve(directory, dirent.name);
          await parseDirectories(directoryPath);
        }
      }),
    );
  };
  await parseDirectories(platformDocumentsPath);
  const contentNavStructure = getNavigationItems(flatArticles);
  return { contentNavStructure, currentPagesContent };
};

/**
 * Create all the slugs (paths) for this page
 */
export async function getStaticPaths() {
  const paths = await getSlugs(platformDocumentsPath);

  return {
    paths,
    fallback: false,
  };
}

/**
 * Source all content on build (via either SSR or SSG). Powerful as agnostic to source. We
 * Could source from multiple data sources easily which will makes transitioning in the future
 * much much easier.
 */
export async function getStaticProps({ params: { slug } }: StaticPathParams) {
  const {
    contentNavStructure,
    currentPagesContent,
  } = await getNavigationArticles(slug);

  return {
    props: {
      contentNavStructure,
      currentPagesContent,
    },
  };
}

export default DocumentPost;
