import { ImageLinkMeta } from './add-relative-links';

export const isPostFileRegex = /docs\.(mdx|md)$/gi;
export const pathRegex = /([^/]*)(.*)\/docs\.(mdx|md)$/gi;
export const orderRegex = /.*\/([0-9+]+)\.[^/]*\/docs\.(mdx|md)$/gi;
export const orderPartRegex = /\/([0-9+]+)\./g;
export const isMdImageRegex = /(!\[.*?\]\()(\S*?)(?=\))\)/g;
export const isHtmlImageRegex = /(<img .*src=["'])(\S*?)(?=("|'))(.*\/>)/gi;
export const connectorsRegex = /^\/platform\/connectors\/docs\/([^/]*)\/([^/]*)/gi;
export const connectorsListRegex = /^\/platform\/connectors\/docs\/([^/]*)\/$/gi;

export const documentFilesBasePath = `${process.cwd()}/content/`;
export const connectorDocsRelativePath = '/connectors/docs';
export const rootImageDirectory = 'images';
export const nextPublicDirectory = 'public';
export const referenceImageSize = 2000; // px
export const articleImageSize = 600; // px
export const lazyLoadImageSize = 20; // px
export const connectorListRelativePath = 'platform/50.connectors/1000.docs';

interface ReplaceLinkInContentProps {
  imageLinkMeta: ImageLinkMeta;
  revisedImageName: string;
  content: string;
  imageWidth?: number;
  imageHeight?: number;
}

export const replaceLinkInContent = ({
  imageLinkMeta,
  revisedImageName,
  content,
  imageHeight,
  imageWidth,
}: ReplaceLinkInContentProps) => {
  // regex to catch all instances of the link in addition to check is prefixed
  // prefix to avoid `(foo-bar.png)` being captured when searching for "bar.png"
  const imageRegex = new RegExp(
    `${imageLinkMeta.imageMdString.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}`,
    'g',
  );
  const src = revisedImageName;
  const alt = imageLinkMeta.altTitle;
  // Create new HTML image string to include size meta data if available
  const newImageString = `<img src="${src}" alt="${alt || ''}" ${
    imageWidth ? `width="${imageWidth}"` : ''
  } ${imageHeight ? `height="${imageHeight}"` : ''} />`;
  return content.replace(imageRegex, newImageString);
};

// inherited function. Need to work out props types but left as any for moment.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const preToCodeBlock = (preProps: any) => {
  if (
    // children is code element
    preProps.children &&
    // code props
    preProps.children.props &&
    // if children is actually a <code>
    preProps.children.props.mdxType === 'code'
  ) {
    // we have a <pre><code> situation
    const {
      children: codeString,
      className = '',
      ...props
    } = preProps.children.props;

    const match = className.match(/language-([\0-\uFFFF]*)/);

    return {
      codeString: codeString.trim(),
      className,
      language: match ? match[1] : '',
      ...props,
    };
  }
  return undefined;
};
