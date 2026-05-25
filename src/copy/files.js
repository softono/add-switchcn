import path from "node:path";
import fs from "fs-extra";

function relativeDisplayPath(cwd, filename) {
  return path.relative(cwd, filename).split(path.sep).join("/");
}

export async function copyRegistryFiles({ cwd, installPath, files, logger }) {
  const added = [];
  const skipped = [];

  for (const file of files) {
    const destination = path.resolve(installPath, ...file.filename.split("/"));
    const installRoot = path.resolve(installPath);

    if (
      destination !== installRoot &&
      !destination.startsWith(`${installRoot}${path.sep}`)
    ) {
      throw new Error("Invalid file path in SwitchCN registry.");
    }

    if (await fs.pathExists(destination)) {
      const displayPath = relativeDisplayPath(cwd, destination);
      logger.warn(`File already exists: ${displayPath}`);
      skipped.push(file.filename);
      continue;
    }

    await fs.outputFile(destination, file.contents, "utf8");
    added.push(file.filename);
  }

  return { added, skipped };
}
