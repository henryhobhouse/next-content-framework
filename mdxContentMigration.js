const { readdir, readFile, writeFile } = require('fs').promises;
const { resolve } = require('path');

const dirTree = require('directory-tree');

const documentFilesBasePath = `${process.cwd()}/content/`;
const isPostFileRegex = /docs\.(mdx|md)$/g;
const orderPartRegex = /^([0-9+]+)\./g;
const imageUrls = /(\!\[.*?\]\()(\S*?)(?=\))/g;
const isUrlRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/g;

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
      return !isExternal && hasPath ? updatedLink : false;
    })
    .filter(Boolean);
  if (!filteredLinks.length) return [];
  return filteredLinks;
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
  const linkDirectories = link
    .split('/')
    .filter((dir) => dir !== '.' && dir !== '');
  const parsedLinkDirectories = [];
  const fileName = linkDirectories.pop();
  linkDirectories.forEach((directory) => {
    if (directory === '..') {
      parsedLinkDirectories.push(directory);
      return;
    }
    const correctDirectoryName = findDirectory(directory, contentDirStructure);
    if (!correctDirectoryName) {
      throw new Error(`${link} in ${markdownFileLocation} does not exist`);
    }
    parsedLinkDirectories.push(correctDirectoryName);
  });
  return [...parsedLinkDirectories, fileName].join('/');
};

const updateLinks = async (
  linksWithPaths,
  markdownText,
  contentDirStructure,
  markdownFileLocation,
) => {
  let updatedContent = markdownText;
  let hasBeenUpdated = false;
  await Promise.all(
    linksWithPaths.map(async (link) => {
      const parsedLink = getParsedLink(
        link,
        contentDirStructure,
        markdownFileLocation,
      );
      if (link === parsedLink) return;
      hasBeenUpdated = true;
      updatedContent = markdownText.replace(link, parsedLink);
    }),
  );
  if (hasBeenUpdated) {
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
  const contentDirStructure = dirTree('./content/', {
    extensions: /\.fake$/,
  });
  await updateImageLinks(documentFilesBasePath, contentDirStructure);
})();
