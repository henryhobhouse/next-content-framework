import { existsSync } from 'fs';
import { resolve } from 'path';

import tinyGlob from 'tiny-glob';

import imageSizeMetaData from '../image-meta-data.json';

import {
  isHtmlImageRegex,
  isMdImageRegex,
  replaceLinkInContent,
  rootImageDirectory,
  nextPublicDirectory,
} from './mdx-parse';

import { getProcessedImageFileName } from 'lib/server/scripts/image-manipulation/utils';
import { SavedImageAttributes } from 'lib/server/types/image-processing';

const checkFileExists = (filePath: string) => existsSync(filePath);

const checkValidLink = (imageLink: string) =>
  checkFileExists(
    `${process.cwd()}/${nextPublicDirectory}/${rootImageDirectory}/${imageLink}`,
  );

enum LinkType {
  md,
  html,
}

export interface ImageLinkMeta {
  imageSrc: string;
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
        imageSrc: result[2],
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
        imageSrc: result[2],
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
  await Promise.allSettled(
    nonDupedImageLinks.map(async (imageLinkMeta) => {
      // remove any path prefixes (./ or /) from beginning of link
      const nonRelativeLink = imageLinkMeta.imageSrc.replace(/^(.\/|\/)/, '');
      const imageLinkDirectories = nonRelativeLink.split('/');
      const fileName = imageLinkDirectories[
        imageLinkDirectories.length - 1
      ].toLowerCase();
      let filePath = resolve(parentDirectoryRelativePath, fileName);

      if (!existsSync(filePath)) {
        // if image is not available in current directory then try to find it
        // (NOTE: as the links are not as per the file path this operation is quite a bit more expensive
        // than it could be. Consideration to transforming all image links to as per file path (inc ordering)
        // to improve the speed of load at this step.)
        const pathNameOptions = await tinyGlob(`**/${fileName}`);
        if (pathNameOptions && pathNameOptions.length > 0) {
          filePath = resolve(pathNameOptions[0]);
        }
      }

      const processedImageName = getProcessedImageFileName(filePath);

      const imageHash = (imageSizeMetaData as SavedImageAttributes)[
        processedImageName
      ]?.imageHash;

      const revisedImageName = `${imageHash}${processedImageName}` as keyof typeof imageSizeMetaData;

      const imageWidth = (imageSizeMetaData as SavedImageAttributes)[
        processedImageName
      ]?.width;

      const imageHeight = (imageSizeMetaData as SavedImageAttributes)[
        processedImageName
      ]?.height;

      const isValidLink = checkValidLink(revisedImageName);

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
        // eslint-disable-next-line no-undef
        logger.warn(`${imageLinkMeta.imageSrc} does not exist. See error log`);
        // eslint-disable-next-line no-undef
        logger.log({
          noConsole: true,
          level: 'error',
          message: `WARNING: The image "${imageLinkMeta.imageSrc}" referenced in "${parentDirectoryRelativePath}/docs.mdx|md" does not exist.`,
        });
        const links = enhancedContent.match(
          imageLinkMeta.type === LinkType.md
            ? isMdImageRegex
            : isHtmlImageRegex,
        );
        const badLink = links?.find((link) =>
          link.includes(imageLinkMeta.imageSrc),
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
