const { readdir, readFile } = require('fs').promises;
const { resolve } = require('path');

const dirTree = require('directory-tree');

const migrateUtils = require('./utils/migrate-utils');
const documentFilesBasePath = `${process.cwd()}/content/`;
const isPostFileRegex = /docs\.(mdx|md)$/gi;

const migrateContent = async (dir, contentDirStructure) => {
  const dirents = await readdir(dir, { withFileTypes: true });
  const postFile = dirents.find(
    (dirent) => !!dirent.name.match(isPostFileRegex),
  );
  if (postFile) {
    const markdownFileLocation = resolve(dir, postFile.name);
    const markdownText = await (
      await readFile(markdownFileLocation, 'utf8')
    ).toString();

    // update links with paths to check valid and reaplce slug names with those in the file structure
    const linksWithPaths = migrateUtils.getLinksWithPaths(markdownText);
    if (linksWithPaths.length) {
      await migrateUtils.updateImageLinks(
        linksWithPaths,
        markdownText,
        contentDirStructure,
        markdownFileLocation,
      );
    }

    // replace gif player references with standard image links that can now automatically
    // deal with gifs and static images alike.
    const gifPlayers = migrateUtils.getOldGifPlayerJsx(markdownText);
    if (gifPlayers.length) {
      await migrateUtils.updateGifJsx(
        gifPlayers,
        markdownText,
        markdownFileLocation,
      );
    }

    const inlineStyles = migrateUtils.getInlineStyles(markdownText);
    if (inlineStyles.length) {
      await migrateUtils.convertInlineToObjectStyles(
        inlineStyles,
        markdownText,
        markdownFileLocation,
      );
    }

    // TODO: Find redirects and add to next.config (https://nextjs.org/docs/api-reference/next.config.js/redirects)
  }
  await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(dir, dirent.name);
      const isDirectory = dirent.isDirectory();
      return isDirectory ? migrateContent(res, contentDirStructure) : res;
    }),
  );
};

(async () => {
  const contentDirStructure = dirTree('content/', {
    extensions: /\.fake$/,
  });
  await migrateContent(documentFilesBasePath, contentDirStructure);
})();
