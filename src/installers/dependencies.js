import { spawn } from "node:child_process";

function getInstallCommand(packageManager, dependencies) {
  switch (packageManager) {
    case "pnpm":
    case "yarn":
    case "bun":
      return [packageManager, ["add", ...dependencies]];
    default:
      return ["npm", ["install", ...dependencies]];
  }
}

export async function installDependencies({ cwd, packageManager, dependencies }) {
  if (dependencies.length === 0) {
    return;
  }

  const [command, args] = getInstallCommand(packageManager, dependencies);
  const executable = process.platform === "win32" ? `${command}.cmd` : command;

  await new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Failed to install dependencies with ${packageManager}.`));
      }
    });
  });
}
