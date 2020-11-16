import {
  isHtmlImageRegex,
  isMdImageRegex,
  replaceLinkInContent,
  rootImageDirectory,
} from './mdx-parse';

import { FsPromises } from 'pages/embedded/[...articleSlug]';

const checkFileExists = async (filePath: string, promises: FsPromises) => {
  try {
    await promises.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const checkValidLink = async (imageLink: string, promises: FsPromises) =>
  checkFileExists(
    `${process.cwd()}/${rootImageDirectory}/originals/${imageLink}`,
    promises,
  );

enum LinkType {
  md,
  html,
}

export interface ImageLink {
  link: string;
  type: LinkType;
}

/**
 * Takes MD(X) content. Finds links, checks valid by seeing if file is in the images directory before
 * updating the path to the correct file in the images directory but with size prefix to be determined
 * by the app.
 */
const addRelativeImageLinks = async (
  mdxContent: string,
  parentDirectoryRelativePath: string,
  promises: FsPromises,
) => {
  const imageLinksToUpdate: ImageLink[] = [];
  let result: RegExpExecArray | null;

  // default newContent is just the content. i.e. all the links are absolute and don't need updating
  let enhancedContent = mdxContent;
  // markdown image links
  const mdImageRegCheck = new RegExp(isMdImageRegex);
  // html image links
  const htmlImageRegCheck = new RegExp(isHtmlImageRegex);

  // look for md image links in content and each time find one add to fileNamesToUpdate
  while ((result = mdImageRegCheck.exec(mdxContent)) !== null) {
    if (result[2])
      imageLinksToUpdate.push({ link: result[2], type: LinkType.md });
  }

  // look for html image links in content and each time find one add to fileNamesToUpdate
  while ((result = htmlImageRegCheck.exec(mdxContent)) !== null) {
    if (result[2])
      imageLinksToUpdate.push({ link: result[2], type: LinkType.html });
  }

  const nonDupedImageLinks = imageLinksToUpdate.filter(
    (value, index, self) => self.indexOf(value) === index,
  );

  // iterate through image links to parse relative path
  await Promise.all(
    nonDupedImageLinks.map(async (imageLink) => {
      // remove any path prefixes (./ or /) from beginning of link
      const nonRelativeLink = imageLink.link.replace(/^(.\/|\/)/, '');
      const imageLinkDirectories = nonRelativeLink.split('/');
      const fileName = imageLinkDirectories[
        imageLinkDirectories.length - 1
      ].toLowerCase();
      const relativePathSegments = parentDirectoryRelativePath.split('/');
      const imageLinkSegments = nonRelativeLink.split('/');
      const nonRelativeLinkSegments = imageLinkSegments.filter(
        (dir) => dir !== '..',
      );

      // get parent from link structure (when relative link) otherwise directory of docs file
      const parentDirectory =
        imageLinkSegments.length > 1
          ? nonRelativeLinkSegments[nonRelativeLinkSegments.length - 2]
          : relativePathSegments[relativePathSegments.length - 1];
      const parentSlug = parentDirectory
        ?.replace(/([0-9+]+)\./, '')
        .toLowerCase();
      const optimisedFileName = `${parentSlug}-${fileName}`;

      const isValidLink = await checkValidLink(optimisedFileName, promises);

      if (isValidLink) {
        enhancedContent = replaceLinkInContent(
          imageLink.link,
          optimisedFileName,
          enhancedContent,
        );
      }

      if (!isValidLink) {
        // eslint-disable-next-line no-console
        console.warn(
          `WARNING: The image "${imageLink.link}" referenced in "${parentDirectoryRelativePath}/docs.mdx|md" does not exist.`,
        );
        const links = enhancedContent.match(
          imageLink.type === LinkType.md ? isMdImageRegex : isHtmlImageRegex,
        );
        const badLink = links?.find((link) => link.includes(imageLink.link));
        if (badLink) {
          // escape all special characters from link and make global in case multiple instances
          const linkRegex = new RegExp(
            `${badLink.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}`,
            'g',
          );
          enhancedContent = enhancedContent.replace(linkRegex, '');
        }
      }
    }),
  );

  // remove all comments
  enhancedContent = enhancedContent.replace(/<!--.*-->/g, '');

  return enhancedContent;
};

export default addRelativeImageLinks;
