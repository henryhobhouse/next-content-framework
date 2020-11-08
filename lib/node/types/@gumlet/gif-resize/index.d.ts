/* eslint-disable camelcase */
declare module '@gumlet/gif-resize' {
  // https://github.com/gumlet/gif-resize#options
  interface Options {
    width?: number;
    height?: number;
    stretch?: boolean;
    interlaced?: boolean;
    output_webp?: boolean;
    optimizationLevel?: 1 | 2 | 3;
    colors?: number;
    resize_method?: string;
    gamma?: number;
    crop?: number[];
    flip_h?: boolean;
    flip_v?: boolean;
    rotate?: number;
  }
  type Plugin = (imageBuffer: Buffer) => Promise<Buffer>;
  function gifResize(options: Options): Plugin;
  export default gifResize;
}
