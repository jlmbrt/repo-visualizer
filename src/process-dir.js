import { statSync, readdirSync } from "fs";
import { join } from "path";
import { shouldExcludePath } from "./should-exclude-path";

export const processDir = async (
  rootPath = "",
  excludedPaths = [],
  excludedGlobs = []
) => {
  const foldersToIgnore = [".git", ...excludedPaths];
  const fullPathFoldersToIgnore = new Set(
    foldersToIgnore.map((d) => join(rootPath, d))
  );

  const getFileStats = async (path = "") => {
    const stats = statSync(`./${path}`);
    const name = path.split("/").filter(Boolean).slice(-1)[0];
    const size = stats.size;
    const relativePath = path.slice(rootPath.length + 1);
    return {
      name,
      path: relativePath,
      size,
    };
  };
  const addItemToTree = async (path = "", isFolder = true) => {
    try {
      console.log("Looking in ", `./${path}`);

      if (isFolder) {
        const filesOrFolders = readdirSync(`./${path}`);
        const children = [];

        for (const fileOrFolder of filesOrFolders) {
          const fullPath = join(path, fileOrFolder);
          if (
            shouldExcludePath(fullPath, fullPathFoldersToIgnore, excludedGlobs)
          ) {
            continue;
          }

          const info = statSync(`./${fullPath}`);
          const stats = await addItemToTree(fullPath, info.isDirectory());
          if (stats) children.push(stats);
        }

        const stats = await getFileStats(path);
        return { ...stats, children };
      }

      if (shouldExcludePath(path, fullPathFoldersToIgnore, excludedGlobs)) {
        return null;
      }
      const stats = getFileStats(path);
      return stats;
    } catch (e) {
      console.log("Issue trying to read file", path, e);
      return null;
    }
  };

  const tree = await addItemToTree(rootPath);

  return tree;
};
