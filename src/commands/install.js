import path from "node:path";
import fs from "fs-extra";
import { copyRegistryFiles } from "../copy/files.js";
import {
  detectFramework,
  detectPackageManager,
  detectTailwindV4,
  resolveInstallPath,
} from "../detect/project.js";
import { downloadRegistryFiles, fetchRegistry } from "../fetchers/registry.js";
import { installDependencies } from "../installers/dependencies.js";
import { createLogger } from "../logger/index.js";

function displayPath(cwd, filename) {
  return path.relative(cwd, filename).split(path.sep).join("/");
}

export async function installSwitchcn({
  cwd = process.cwd(),
  fetchImpl = fetch,
  logger = createLogger(),
  dependencyInstaller = installDependencies,
} = {}) {
  const packagePath = path.join(cwd, "package.json");
  if (!(await fs.pathExists(packagePath))) {
    throw new Error("package.json not found.");
  }

  const packageJson = await fs.readJson(packagePath);
  detectFramework(packageJson);
  const packageManager = await detectPackageManager(cwd, packageJson);
  logger.success("Detecting project");

  if (!(await detectTailwindV4(cwd, packageJson))) {
    throw new Error("Tailwind CSS v4 not detected.");
  }
  logger.success("Detecting Tailwind CSS v4");

  const installPath = await resolveInstallPath(cwd);
  const resolvedDisplayPath = displayPath(cwd, installPath);
  logger.success(`Resolving install path -> ${resolvedDisplayPath}`);

  const registry = await fetchRegistry(fetchImpl);
  logger.success("Fetching registry");

  const files = await downloadRegistryFiles(registry.files, fetchImpl);
  logger.success("Downloading files");

  const result = await copyRegistryFiles({ cwd, installPath, files, logger });

  if (registry.dependencies.length > 0) {
    await dependencyInstaller({
      cwd,
      packageManager,
      dependencies: registry.dependencies,
    });
    logger.success("Installing dependencies");
  }

  logger.success("Done");
  logger.info(`\nFiles added to: ${resolvedDisplayPath}`);

  return {
    framework: detectFramework(packageJson),
    packageManager,
    installPath,
    ...result,
  };
}
