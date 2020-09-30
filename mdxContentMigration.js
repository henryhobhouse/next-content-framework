const { readdir, readFile, writeFile } = require('fs').promises;
const { resolve } = require('path');

const dirTree = require('directory-tree');

const documentFilesBasePath = `${process.cwd()}/content/`;
const isPostFileRegex = /docs\.(mdx|md)$/g;
const orderPartRegex = /^([0-9+]+)\./g;
const imageUrls = /(\!\[.*?\]\()(\S*?)(?=\))/g;

const getLinksWithPaths = (markdownTextBuffer) => {
  const links = [];
  let result;
  const regCheck = new RegExp(imageUrls);
  while ((result = regCheck.exec(markdownTextBuffer.toString()))) {
    if (result[2]) links.push(result[2]);
  }
  return links.filter((link) => {
    // remove any relative path prefix (./ or /)
    link.replace(/^(.\/|\/)/, '');
    return link.split('/').length > 1;
  });
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

const getParsedLink = (link, currentDirectory, contentDirStructure) => {
  const linkDirectories = link.split('/');
  const parsedLinkDirectories = [];
  const fileName = linkDirectories.pop();
  linkDirectories.forEach((directory) => {
    if (directory === '..') {
      parsedLinkDirectories.push(directory);
      return;
    }
    const correctDirectoryName = findDirectory(directory, contentDirStructure);
    parsedLinkDirectories.push(correctDirectoryName);
  });
  return [...parsedLinkDirectories, fileName].join('/');
};

const updateLinks = async (
  linksWithPaths,
  markdownText,
  dir,
  contentDirStructure,
  markdownFileLocation,
) => {
  let updatedContent = markdownText;
  Promise.all(
    linksWithPaths.map(async (link) => {
      const parsedLink = getParsedLink(link, dir, contentDirStructure);
      if (link === parsedLink) return;
      updatedContent = markdownText.replace(link, parsedLink);
    }),
  );
  if (updatedContent === markdownText) return;
  await writeFile(markdownFileLocation, updatedContent);
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
        dir,
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
