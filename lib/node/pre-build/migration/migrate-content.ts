import { promises } from 'fs';
import dirTree, { DirectoryTree } from 'directory-tree';
import { resolve } from 'path';
import { Redirect } from 'next/dist/lib/load-custom-routes';
import {
  getLinksWithPaths,
  updateImageLinks,
  getOldGifPlayerJsx,
  updateGifJsx,
  getRedirectLink,
  removeRedirectLink,
  setNextRedirects,
} from './migrate-utils';
import { contentRootPath } from '../../../page-mdx/mdx-parse';

const isPostFileRegex = /docs\.(mdx|md)$/gi;
const orderPartRegex = /\/([0-9+]+)\./g;
const pathRegex = /([^/]*)(.*)\/docs\.(mdx|md)$/gi;

const redirectLinks: Redirect[] = [];

const migrateContent = async (
  dir: string,
  contentDirStructure: DirectoryTree,
) => {
  const dirents = await promises.readdir(dir, { withFileTypes: true });
  const postFile = dirents.find(
    (dirent) => !!dirent.name.match(isPostFileRegex),
  );
  if (postFile) {
    const markdownFileLocation = resolve(dir, postFile.name);
    const markdownText = await (
      await promises.readFile(markdownFileLocation, 'utf8')
    ).toString();

    // update links with paths to check valid and reaplce slug names with those in the file structure
    const linksWithPaths = getLinksWithPaths(markdownText);
    if (linksWithPaths.length)
      await updateImageLinks(
        linksWithPaths,
        markdownText,
        contentDirStructure,
        markdownFileLocation,
      );

    // replace gif player references with standard image links that can now automatically
    // deal with gifs and static images alike.
    const gifPlayers = getOldGifPlayerJsx(markdownText);
    if (gifPlayers.length)
      await updateGifJsx(gifPlayers, markdownText, markdownFileLocation);

    // assume only one redirect per file. Find, copy to next config, and remove original.
    // redirects setup as per (https://nextjs.org/docs/api-reference/next.config.js/redirects)
    const redirectLink = getRedirectLink(markdownText);
    const sourceMatch = redirectLink?.match(/(?<=\s)(\S+$)/gim);
    const redirectSources = Array.isArray(sourceMatch)
      ? sourceMatch.map((rawSource) => rawSource.replace(/\/$/, ''))
      : [];

    if (redirectLink) {
      const relativePath = markdownFileLocation.replace(
        `${process.cwd()}/content/`,
        '',
      );
      pathRegex.lastIndex = 0;
      const pathComponents = pathRegex.exec(relativePath);
      if (pathComponents) {
        const section = pathComponents[1];
        const path = pathComponents[2];
        const localPath = path.replace(orderPartRegex, '/');
        const slug = `/${section}${localPath}`;
        redirectSources.forEach((redirectSource) => {
          redirectLinks.push({
            source: redirectSource,
            destination: slug,
            permanent: true,
          });
        });
        await removeRedirectLink(
          redirectLink,
          markdownText,
          markdownFileLocation,
        );
      }
    }
  }
  await Promise.allSettled(
    dirents.map(async (dirent) => {
      const directPath = resolve(dir, dirent.name);
      const isDirectory = dirent.isDirectory();
      if (isDirectory) await migrateContent(directPath, contentDirStructure);
    }),
  );
};

(async () => {
  const contentDirStructure = dirTree('content/', {
    extensions: /\.fake$/,
  });
  await migrateContent(contentRootPath, contentDirStructure);
  if (redirectLinks.length) {
    await setNextRedirects(redirectLinks);
  }
})();
