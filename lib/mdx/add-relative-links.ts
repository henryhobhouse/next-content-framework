import {
  imageUrls,
  replaceLinkInContent,
  rootImageDirectory,
} from './mdx-parse';

import { FsPromises } from 'pages/embedded/[...slug]';

const checkFileExists = async (filePath: string, promises: FsPromises) => {
  try {
    await promises.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const checkValidLink = async (imageLink: string, promises: FsPromises) => {
  return checkFileExists(
    `${process.cwd()}/${rootImageDirectory}/originals/${imageLink}`,
    promises,
  );
};

/**
 * Takes MD(X) content. Finds links, checks valid by seeing if file is in the images directory before
 * updating the path to the correct file in the images directory but with size prefix to be determined
 * by the app.
 */
export const addRelativeImageLinks = async (
  mdxContent: string,
  relativePath: string,
  promises: FsPromises,
) => {
  const imageLinksToUpdate: string[] = [];
  let result: RegExpExecArray | null;

  // default newContent is just the content. i.e. all the links are absolute and don't need updating
  let enhancedContent = mdxContent;
  const regCheck = new RegExp(imageUrls);

  // look for image links in content and each time find one add to fileNamesToUpdate
  while ((result = regCheck.exec(mdxContent)) !== null) {
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
      const fileName = imageLinkDirectories[
        imageLinkDirectories.length - 1
      ].toLowerCase();
      const relativePathSegments = relativePath.split('/');
      const imageLinkSegments = imageLink.split('/');
      // get parent from link structure (when relative link) otherwise directory of docs file
      const parentDirectory =
        imageLinkSegments.length > 1
          ? imageLinkSegments[relativePathSegments.length - 2]
          : relativePathSegments[relativePathSegments.length - 1];
      const parentSlug = parentDirectory
        ?.replace(/([0-9+]+)\./, '')
        .toLowerCase();
      const optimisedFileName = `${parentSlug}-${fileName}`;

      const isValidLink = await checkValidLink(optimisedFileName, promises);

      if (isValidLink) {
        enhancedContent = replaceLinkInContent(
          imageLink,
          optimisedFileName,
          enhancedContent,
        );
      }

      if (!isValidLink) {
        // eslint-disable-next-line no-console
        console.warn(
          `WARNING: The image "${imageLink}" referenced in "${relativePath}/docs.mdx|md" does not exist.`,
        );
        const links = enhancedContent.match(imageUrls);
        const badLink = links?.find((link) => link.includes(imageLink));
        if (badLink) {
          enhancedContent = enhancedContent.replace(badLink, '');
        }
      }
    }),
  );

  // remove all comments
  enhancedContent = enhancedContent.replace(/\<\!\-\-.*\-\-\>/g, '');

  return enhancedContent;
};
