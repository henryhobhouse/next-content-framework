const { writeFile } = require('fs').promises;

const _ = require('lodash');

const orderPartRegex = /^([0-9+]+)\./g;
const imageUrls = /(\!\[.*?\]\()(\S*?)(?=\))/g;
const isUrlRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/g;
const isGifPlayerRegex = /(<GifPlayer)(.*)(\/>)/g;
const isInlineStyleRegex = /(?<=style=)".*"/g;

const getLinksWithPaths = (markdownTextBuffer) => {
  const links = [];
  let result;
  const regCheck = new RegExp(imageUrls);
  while ((result = regCheck.exec(markdownTextBuffer.toString()))) {
    if (result[2]) links.push(result[2]);
  }
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
  return filteredLinks;
};

const getInlineStyles = (markdownTextBuffer) => {
  const inlineStyles = [];
  let result;
  const regCheck = new RegExp(isInlineStyleRegex);
  while ((result = regCheck.exec(markdownTextBuffer.toString()))) {
    if (result[0]) inlineStyles.push(result[0]);
  }
  return inlineStyles;
};

const convertInlineToObjectStyles = async (
  inlineStyles,
  markdownText,
  markdownFileLocation,
) => {
  let enhancedContent = markdownText;
  inlineStyles.forEach((inlineStyle) => {
    const keyValueStrings = inlineStyle
      .replace(/\"/g, '')
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
      `${inlineStyle.replace(/[-\/\\;:^$*+?.()|[\]{}]/g, '\\$&')}`,
      'gi',
    );
    const stringifiedStyles = JSON.stringify(styleObject);
    enhancedContent = enhancedContent.replace(
      existingLinkRegex,
      `{${stringifiedStyles}}`,
    );
  });
  await writeFile(markdownFileLocation, enhancedContent);
};

const getOldGifPlayerJsx = (markdownTextBuffer) => {
  const gifPlayers = [];
  let result;
  const regCheck = new RegExp(isGifPlayerRegex);
  while ((result = regCheck.exec(markdownTextBuffer.toString()))) {
    if (result[0]) gifPlayers.push(result[0]);
  }
  return gifPlayers;
};

const findDirectory = (dirName, dirStructure) => {
  if (
    dirStructure.name === dirName ||
    dirStructure.name.replace(orderPartRegex, '') === dirName
  )
    return dirStructure.name;

  if (!dirStructure.children || dirStructure.children.length === 0)
    return false;

  let foundChildDirectory;
  dirStructure.children.some((childDirectory) => {
    foundChildDirectory = findDirectory(dirName, childDirectory);
    return foundChildDirectory;
  });
  return foundChildDirectory;
};

const getParsedLink = (link, contentDirStructure, markdownFileLocation) => {
  const updatedLink = link.replace(/^(.\/|\/)/, '');
  const linkDirectories = updatedLink
    .split('/')
    .filter((dir) => dir !== '.' && dir !== '' && dir !== 'content');
  const parsedLinkDirectories = [];
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
    }
    parsedLinkDirectories.push(correctDirectoryName);
  });
  return [...parsedLinkDirectories, fileName].join('/');
};

const updateGifJsx = async (gifPlayers, markdownText, markdownFileLocation) => {
  let updatedContent = markdownText;
  gifPlayers.forEach((player) => {
    const link = player.match(/(?<=gif=")(.*)(?=")/);
    updatedContent = updatedContent.replace(player, `![Gif](${link[0]})`);
  });
  await writeFile(markdownFileLocation, updatedContent);
};

const updateImageLinks = async (
  linksWithPaths,
  markdownText,
  contentDirStructure,
  markdownFileLocation,
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
    if (!updatedContent)
      throw new Error('no content has been updated', markdownFileLocation);
    await writeFile(markdownFileLocation, updatedContent);
  }
};

exports.updateImageLinks = updateImageLinks;
exports.updateGifJsx = updateGifJsx;
exports.getOldGifPlayerJsx = getOldGifPlayerJsx;
exports.getLinksWithPaths = getLinksWithPaths;
exports.getInlineStyles = getInlineStyles;
exports.convertInlineToObjectStyles = convertInlineToObjectStyles;
