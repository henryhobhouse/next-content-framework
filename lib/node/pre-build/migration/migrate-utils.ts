/* eslint-disable no-cond-assign */
import { DirectoryTree } from 'directory-tree';
import { promises, writeFileSync } from 'fs';

import _ from 'lodash';
import { Redirect } from 'next/dist/lib/load-custom-routes';

const orderPartRegex = /^([0-9+]+)\./g;
const imageUrls = /(!\[.*?\]\()(\S*?)(?=\))/g;
const isUrlRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)/g;
const isGifPlayerRegex = /(<GifPlayer)(.*)(\/>)/g;
const isInlineStyleRegex = /(?<=style=)".*"/g;
const redirectLinkRegex = /redirect_from:(\s*-\s*[/\-\w]*\n)*(?=---|\w{2,})/im;

export const getLinksWithPaths = (markdownText: string) => {
  const links: string[] = [];
  let result;
  const regCheck = new RegExp(imageUrls);
  // eslint-disable-next-line prettier/prettier
  while (result = regCheck.exec(markdownText))
    if (result[2]) links.push(result[2]);

  const filteredLinks = links
    .map((link) => {
      // remove any relative path prefix (./ or /)
      const updatedLink = link.replace(/^(.\/|\/)/, '');
      const hasPath = updatedLink.split('/').length > 1;
      const isExternal = !!updatedLink.match(isUrlRegex);
      return !isExternal && hasPath ? link : false;
    })
    .filter(Boolean);
  if (!filteredLinks.length) return [];
  return filteredLinks as string[];
};

export const getInlineStyles = (markdownText: string) => {
  const inlineStyles: string[] = [];
  let result;
  const regCheck = new RegExp(isInlineStyleRegex);
  while ((result = regCheck.exec(markdownText)))
    if (result[0]) inlineStyles.push(result[0]);

  return inlineStyles;
};

export const getRedirectLink = (markdownText: string) => {
  const regCheck = new RegExp(redirectLinkRegex);
  const redirectLink = regCheck.exec(markdownText);
  return Array.isArray(redirectLink) ? redirectLink[0] : '';
};

export const convertInlineToObjectStyles = async (
  inlineStyles: string[],
  markdownText: string,
  markdownFileLocation: string,
) => {
  let enhancedContent = markdownText;
  inlineStyles.forEach((inlineStyle) => {
    const keyValueStrings = inlineStyle
      .replace(/"/g, '')
      .split(';')
      .filter(Boolean);
    const styleObject = keyValueStrings.reduce((acc, keyValueString) => {
      const keyValue = keyValueString.split(':');
      const key = _.camelCase(keyValue[0]);
      return {
        ...acc,
        [key]: keyValue[1],
      };
    }, {});
    const existingLinkRegex = new RegExp(
      `${inlineStyle.replace(/[-/\\;:^$*+?.()|[\]{}]/g, '\\$&')}`,
      'gi',
    );
    const stringifiedStyles = JSON.stringify(styleObject);
    enhancedContent = enhancedContent.replace(
      existingLinkRegex,
      `{${stringifiedStyles}}`,
    );
  });
  await promises.writeFile(markdownFileLocation, enhancedContent);
};

export const getOldGifPlayerJsx = (markdownText: string) => {
  const gifPlayers: string[] = [];
  let result;
  const regCheck = new RegExp(isGifPlayerRegex);
  while ((result = regCheck.exec(markdownText)))
    if (result[0]) gifPlayers.push(result[0]);

  return gifPlayers;
};

const findDirectory = (
  dirName: string,
  dirStructure: DirectoryTree,
): false | string => {
  if (
    dirStructure.name === dirName ||
    dirStructure.name.replace(orderPartRegex, '') === dirName
  )
    return dirStructure.name;

  if (!dirStructure.children || dirStructure.children.length === 0)
    return false;

  let foundChildDirectory: string | false = false;
  dirStructure.children.some((childDirectory) => {
    foundChildDirectory = findDirectory(dirName, childDirectory);
    return foundChildDirectory;
  });
  return foundChildDirectory;
};

export const getParsedLink = (
  link: string,
  contentDirStructure: DirectoryTree,
  markdownFileLocation: string,
) => {
  const updatedLink = link.replace(/^(.\/|\/)/, '');
  const linkDirectories = updatedLink
    .split('/')
    .filter((dir) => dir !== '.' && dir !== '' && dir !== 'content');
  const parsedLinkDirectories: string[] = [];
  const fileName = linkDirectories.pop();
  linkDirectories.forEach((directory) => {
    if (directory === '..') {
      parsedLinkDirectories.push(directory);
      return;
    }
    const correctDirectoryName = findDirectory(directory, contentDirStructure);
    if (!correctDirectoryName) {
      // eslint-disable-next-line no-console
      console.error(`${link} in ${markdownFileLocation} does not exist`);
    } else {
      parsedLinkDirectories.push(correctDirectoryName);
    }
  });
  return [...parsedLinkDirectories, fileName].join('/');
};

export const updateGifJsx = (
  gifPlayers: string[],
  markdownText: string,
  markdownFileLocation: string,
) => {
  let updatedContent = markdownText;
  gifPlayers.forEach((player) => {
    const link = player.match(/(?<=gif=")(.*)(?=")/);
    if (Array.isArray(link)) {
      updatedContent = updatedContent.replace(player, `![Gif](${link[0]})`);
    }
  });
  writeFileSync(markdownFileLocation, updatedContent);
};

export const updateImageLinks = async (
  linksWithPaths: string[],
  markdownText: string,
  contentDirStructure: DirectoryTree,
  markdownFileLocation: string,
) => {
  let updatedContent = markdownText;
  let hasBeenUpdated = false;
  linksWithPaths.forEach((link) => {
    const parsedLink = getParsedLink(
      link,
      contentDirStructure,
      markdownFileLocation,
    );
    if (link === parsedLink) return;
    hasBeenUpdated = true;
    updatedContent = updatedContent.replace(link, parsedLink);
  });
  if (hasBeenUpdated) {
    if (!updatedContent) {
      throw new Error(`no content has been updated at ${markdownFileLocation}`);
    }
    await promises.writeFile(markdownFileLocation, updatedContent);
  }
};

export const removeRedirectLink = async (
  redirectLink: string,
  markdownText: string,
  markdownFileLocation: string,
) => {
  let updatedContent = markdownText;
  const linkRegex = new RegExp(
    `${redirectLink.replace(/[-/\\^$*+?.()|[\]{}]/gm, '\\$&')}`,
  );
  updatedContent = updatedContent.replace(linkRegex, '');
  await promises.writeFile(markdownFileLocation, updatedContent);
};

export const setNextRedirects = async (redirectLinks: Redirect[]) => {
  if (redirectLinks.length) {
    const linksModule = `module.exports = ${JSON.stringify(
      redirectLinks,
      null,
      2,
    )};`;
    await promises.writeFile(`${process.cwd()}/redirects.js`, linksModule);
  }
};
