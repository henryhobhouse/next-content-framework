import imageSizeMetaData from '../image-meta-data.json';

import {
  isHtmlImageRegex,
  isMdImageRegex,
  replaceLinkInContent,
  rootImageDirectory,
  staticImageDirectory,
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
    `${process.cwd()}/${staticImageDirectory}/${rootImageDirectory}/${imageLink}`,
    promises,
  );

enum LinkType {
  md,
  html,
}

export interface ImageLinkMeta {
  imageUrl: string;
  type: LinkType;
  imageMdString: string;
  altTitle?: string;
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
  const imageLinksToUpdate: ImageLinkMeta[] = [];
  let result: RegExpExecArray | null;

  // default newContent is just the content. i.e. all the links are absolute and don't need updating
  let enhancedContent = mdxContent;
  // markdown image links
  const mdImageRegCheck = new RegExp(isMdImageRegex);
  // html image links
  const htmlImageRegCheck = new RegExp(isHtmlImageRegex);

  // look for md image links in content and each time find one add to fileNamesToUpdate
  while ((result = mdImageRegCheck.exec(mdxContent)) !== null) {
    if (result[2]) {
      // remove the ![ prefix and ]( postfix from string to get alt title
      const altTitle = result[1].replace(/(^!\[)|(]\($)/gi, '');
      imageLinksToUpdate.push({
        imageUrl: result[2],
        type: LinkType.md,
        imageMdString: result[0],
        altTitle,
      });
    }
  }

  // look for html image links in content and each time find one add to fileNamesToUpdate
  while ((result = htmlImageRegCheck.exec(mdxContent)) !== null) {
    if (result[2]) {
      const altTitleArray = result[0].match(/(?<=alt=")\S+(?=")/gi);
      const altTitle = altTitleArray ? altTitleArray[0] : undefined;
      imageLinksToUpdate.push({
        imageUrl: result[2],
        type: LinkType.html,
        imageMdString: result[0],
        altTitle,
      });
    }
  }

  const nonDupedImageLinks = imageLinksToUpdate.filter(
    (value, index, self) => self.indexOf(value) === index,
  );

  // iterate through image links to parse relative path
  await Promise.all(
    nonDupedImageLinks.map(async (imageLinkMeta) => {
      // remove any path prefixes (./ or /) from beginning of link
      const nonRelativeLink = imageLinkMeta.imageUrl.replace(/^(.\/|\/)/, '');
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
      const revisedImageName = `${parentSlug}-${fileName}` as keyof typeof imageSizeMetaData;
      const imageWidth = imageSizeMetaData[revisedImageName]?.width;
      const imageHeight = imageSizeMetaData[revisedImageName]?.height;

      const isValidLink = await checkValidLink(revisedImageName, promises);

      if (isValidLink) {
        enhancedContent = replaceLinkInContent({
          imageLinkMeta,
          revisedImageName,
          content: enhancedContent,
          imageWidth,
          imageHeight,
        });
      }

      if (!isValidLink) {
        // eslint-disable-next-line no-console
        console.warn(
          `WARNING: The image "${imageLinkMeta.imageUrl}" referenced in "${parentDirectoryRelativePath}/docs.mdx|md" does not exist.`,
        );
        const links = enhancedContent.match(
          imageLinkMeta.type === LinkType.md
            ? isMdImageRegex
            : isHtmlImageRegex,
        );
        const badLink = links?.find((link) =>
          link.includes(imageLinkMeta.imageUrl),
        );
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
