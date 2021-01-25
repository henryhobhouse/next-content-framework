export const currentWorkingDirectory = process.cwd();
export const nextPublicDirectory = 'public';
export const localImageCachePath = `${currentWorkingDirectory}/.image-processing-cache`;
export const localModifiedCacheFile = 'local-modified-time.json';
export const localModifiedFilePath = `${localImageCachePath}/${localModifiedCacheFile}`;
