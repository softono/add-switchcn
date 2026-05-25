import path from "node:path";
import fs from "fs-extra";

function getAllDependencies(packageJson) {
  return {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
    ...packageJson.peerDependencies,
  };
}

export function detectFramework(packageJson) {
  const dependencies = getAllDependencies(packageJson);

  if (dependencies.next) {
    return "next";
  }

  if (dependencies.react) {
    return "react";
  }

  throw new Error("Unsupported project structure.");
}

function declaresTailwindV4(version) {
  if (typeof version !== "string") {
    return false;
  }

  return /(?:^|[@:^~<>=\s])v?4(?:\.|$)/.test(version);
}

export async function detectTailwindV4(cwd, packageJson) {
  const installedPath = path.join(cwd, "node_modules", "tailwindcss", "package.json");

  if (await fs.pathExists(installedPath)) {
    const installed = await fs.readJson(installedPath);
    if (declaresTailwindV4(installed.version)) {
      return true;
    }
  }

  const dependencies = getAllDependencies(packageJson);
  return declaresTailwindV4(dependencies.tailwindcss);
}

export async function detectPackageManager(cwd, packageJson) {
  const packageManager = packageJson.packageManager?.split("@")[0];

  if (["npm", "pnpm", "yarn", "bun"].includes(packageManager)) {
    return packageManager;
  }

  const lockfiles = [
    ["pnpm-lock.yaml", "pnpm"],
    ["yarn.lock", "yarn"],
    ["bun.lock", "bun"],
    ["bun.lockb", "bun"],
    ["package-lock.json", "npm"],
  ];

  for (const [filename, manager] of lockfiles) {
    if (await fs.pathExists(path.join(cwd, filename))) {
      return manager;
    }
  }

  return "npm";
}

export async function resolveInstallPath(cwd) {
  const srcComponents = path.join(cwd, "src", "components");
  if (await fs.pathExists(srcComponents)) {
    return path.join(srcComponents, "switchcn");
  }

  const components = path.join(cwd, "components");
  return path.join(components, "switchcn");
}
