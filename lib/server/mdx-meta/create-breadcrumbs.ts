import { writeFileSync } from 'fs';

import { NodeData } from './create-mdx-node-data-model';

const breadCrumbs: { [key: string]: string[] } = {};
const directoryTitle: { [key: string]: string } = {};
const currentWorkingDirectory = process.cwd();
const breadCrumbsFileName = 'bread-crumbs.json';
const breadCrumbsFilePath = `${currentWorkingDirectory}/lib/node/${breadCrumbsFileName}`;

const getContentSectionToProductName = (contentSection: string): string => {
  let productName;
  switch (contentSection) {
    case 'platform':
      productName = 'Tray Platform';
      break;
    case 'embedded':
      productName = 'Tray Embedded';
      break;
    case 'connectors':
      productName = 'Connectors';
      break;
    default:
      throw new Error('content section does not exists');
  }
  return productName;
};

/**
 * Create breadcrumbs from node data and save to file with index key being slug of route.
 *
 * File to be consumed by get articles components to get array of breadcrumbs for each relevant page and
 * pass back to getStaticProps function to be passed as prop to the page and built by webpack.
 */
const createBreadcrumbs = async (allNodeData: NodeData[]) => {
  allNodeData.forEach((nodeData) => {
    // split slug into directories and remove any empty strings/falsey values.
    const slugSegments = nodeData.slug.split('/').filter(Boolean);
    // get last directory from the slug as represents the current node.
    const currentUrlDirectory = slugSegments.slice(-1).pop();

    const contentRoot = slugSegments.slice(0, 1).pop();
    // on chance the slug was empty then to return.
    if (!currentUrlDirectory) return;
    // add relevant title value to the current url directory name key in the directory title object.
    // makes for fast recall of the title by url directory without having to iterate through all nodes.
    directoryTitle[currentUrlDirectory] = nodeData.title;

    // only care about the nodes that are above level one as level one is only titles and does
    // not require breadcrumbs.
    if (nodeData.level > 1 && contentRoot) {
      const contentSectionProductName = getContentSectionToProductName(
        contentRoot,
      );
      const sectionTitles = slugSegments
        .slice(1)
        .map((slugDirectory) => {
          const slugDirectoryTitle = directoryTitle[slugDirectory];
          // As nodes are added recurrisively we know that all parents for each node will be
          // higher in the array so will therefore be already processed by this iterator. Error to be
          // thrown in case how node data is created is changed and this assumption is no longer true.
          if (!slugDirectoryTitle) {
            logger.warn(
              `BREADCRUMBS: ${slugSegments.join(
                '/',
              )} missing title for ${slugDirectory} section`,
            );
            return undefined;
          }
          return directoryTitle[slugDirectory];
        })
        .filter(Boolean) as string[];

      breadCrumbs[nodeData.slug] = [
        contentSectionProductName,
        ...sectionTitles,
      ];
    }
  });
  // make the breadcrumbs readable
  const pretifiedBreadCrumbsString = JSON.stringify(breadCrumbs, null, 2);
  // save the breadcrumbs to file and overwrite any existing data.
  writeFileSync(breadCrumbsFilePath, pretifiedBreadCrumbsString);
};

export default createBreadcrumbs;
