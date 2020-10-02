const { readdir, readFile, writeFile } = require('fs').promises;
const { resolve } = require('path');

const dirTree = require('directory-tree');

const documentFilesBasePath = `${process.cwd()}/content/`;
const isPostFileRegex = /docs\.(mdx|md)$/g;
const orderPartRegex = /^([0-9+]+)\./g;
const imageUrls = /(\!\[.*?\]\()(\S*?)(?=\))/g;
const isUrlRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/g;
const isGifPlayerRegex = /(<GifPlayer)(.*)(\/>)/g;

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

const getGifPlayers = (markdownTextBuffer) => {
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

const replaceGifPlayers = async (
  gifPlayers,
  markdownText,
  markdownFileLocation,
) => {
  let updatedContent = markdownText;
  gifPlayers.forEach((player) => {
    const link = player.match(/(?<=gif=")(.*)(?=")/);
    updatedContent = updatedContent.replace(player, `![Gif](${link[0]})`);
  });
  await writeFile(markdownFileLocation, updatedContent);
};

const updateLinks = async (
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

const updateImageLinks = async (dir, contentDirStructure) => {
  const dirents = await readdir(dir, { withFileTypes: true });
  const postFile = dirents.find(
    (dirent) => !!dirent.name.match(isPostFileRegex),
  );
  if (postFile) {
    const markdownFileLocation = resolve(dir, postFile.name);
    const markdownText = await (
      await readFile(markdownFileLocation, 'utf8')
    ).toString();
    const linksWithPaths = getLinksWithPaths(markdownText);
    if (linksWithPaths.length) {
      await updateLinks(
        linksWithPaths,
        markdownText,
        contentDirStructure,
        markdownFileLocation,
      );
    }
    const gifPlayers = getGifPlayers(markdownText);
    if (gifPlayers.length) {
      await replaceGifPlayers(gifPlayers, markdownText, markdownFileLocation);
    }
  }
  await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(dir, dirent.name);
      const isDirectory = dirent.isDirectory();
      return isDirectory ? updateImageLinks(res, contentDirStructure) : res;
    }),
  );
};

(async () => {
  const contentDirStructure = dirTree('../content/', {
    extensions: /\.fake$/,
  });
  await updateImageLinks(documentFilesBasePath, contentDirStructure);
})();
