// Version utility for MySked
// This reads the version from package.json at build time

// Import package.json to get version
import packageJson from '../../package.json';

export const APP_VERSION = packageJson.version;

// Format version for display
export const formatVersion = (version: string = APP_VERSION): string => `v${version}`;

// Get version with build date (if available)
export const getVersionInfo = (): string => {
  const version = formatVersion();
  const buildDate = import.meta.env.VITE_BUILD_DATE;
  
  if (buildDate) {
    return `${version} (${new Date(buildDate).toLocaleDateString()})`;
  }
  
  return version;
};

// Get just the version number for API calls or technical display
export const getVersionNumber = (): string => APP_VERSION;

