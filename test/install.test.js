import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { afterEach, test } from "node:test";
import fs from "fs-extra";
import { installSwitchcn } from "../src/commands/install.js";

const temporaryDirectories = [];

async function createProject(packageJson, directories = []) {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "add-switchcn-"));
  temporaryDirectories.push(cwd);
  await fs.writeJson(path.join(cwd, "package.json"), packageJson);
  await Promise.all(directories.map((directory) => fs.ensureDir(path.join(cwd, directory))));
  return cwd;
}

function createLogger() {
  const messages = { success: [], warn: [], info: [] };
  return {
    messages,
    success(message) {
      messages.success.push(message);
    },
    warn(message) {
      messages.warn.push(message);
    },
    info(message) {
      messages.info.push(message);
    },
  };
}

function registryFetch({ dependencies = [] } = {}) {
  return async (url) => {
    if (url.endsWith("/registry-item.json")) {
      return {
        ok: true,
        async json() {
          return {
            dependencies,
            files: ["themes/default.json", "index.ts"],
          };
        },
      };
    }

    return {
      ok: true,
      async text() {
        return `contents:${url.split("/").at(-1)}`;
      },
    };
  };
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((cwd) => fs.remove(cwd)));
});

test("installs registry files under src/components when available", async () => {
  const cwd = await createProject(
    { dependencies: { react: "^19.0.0", tailwindcss: "^4.1.0" } },
    ["src/components"],
  );
  const logger = createLogger();

  const result = await installSwitchcn({ cwd, fetchImpl: registryFetch(), logger });

  assert.equal(result.installPath, path.join(cwd, "src", "components", "switchcn"));
  assert.equal(
    await fs.readFile(path.join(result.installPath, "themes", "default.json"), "utf8"),
    "contents:default.json",
  );
  assert.deepEqual(result.added, ["themes/default.json", "index.ts"]);
  assert.deepEqual(result.skipped, []);
});

test("installs under components and does not overwrite existing files", async () => {
  const cwd = await createProject({
    dependencies: { next: "^15.0.0", react: "^19.0.0" },
    devDependencies: { tailwindcss: "^4.0.0" },
  });
  const logger = createLogger();
  const existingPath = path.join(cwd, "components", "switchcn", "index.ts");
  await fs.outputFile(existingPath, "keep-me", "utf8");

  const result = await installSwitchcn({ cwd, fetchImpl: registryFetch(), logger });

  assert.equal(await fs.readFile(existingPath, "utf8"), "keep-me");
  assert.deepEqual(result.skipped, ["index.ts"]);
  assert.deepEqual(logger.messages.warn, [
    "File already exists: components/switchcn/index.ts",
  ]);
});

test("uses the detected package manager to install registry dependencies", async () => {
  const cwd = await createProject({
    packageManager: "pnpm@10.0.0",
    dependencies: { react: "^19.0.0", tailwindcss: "^4.1.0" },
  });
  const calls = [];

  await installSwitchcn({
    cwd,
    fetchImpl: registryFetch({ dependencies: ["next-themes"] }),
    logger: createLogger(),
    dependencyInstaller: async (request) => calls.push(request),
  });

  assert.equal(calls[0].packageManager, "pnpm");
  assert.deepEqual(calls[0].dependencies, ["next-themes"]);
});

test("rejects projects without Tailwind CSS v4", async () => {
  const cwd = await createProject({
    dependencies: { react: "^19.0.0", tailwindcss: "^3.4.0" },
  });

  await assert.rejects(
    installSwitchcn({ cwd, fetchImpl: registryFetch(), logger: createLogger() }),
    /Tailwind CSS v4 not detected\./,
  );
});

test("reports when package.json is missing", async () => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "add-switchcn-"));
  temporaryDirectories.push(cwd);

  await assert.rejects(
    installSwitchcn({ cwd, fetchImpl: registryFetch(), logger: createLogger() }),
    /package\.json not found\./,
  );
});

test("rejects unsafe paths supplied by the registry", async () => {
  const cwd = await createProject({
    dependencies: { react: "^19.0.0", tailwindcss: "^4.1.0" },
  });
  const fetchImpl = async () => ({
    ok: true,
    async json() {
      return { dependencies: [], files: ["../outside.ts"] };
    },
  });

  await assert.rejects(
    installSwitchcn({ cwd, fetchImpl, logger: createLogger() }),
    /Failed to fetch SwitchCN registry\./,
  );
  assert.equal(await fs.pathExists(path.join(cwd, "outside.ts")), false);
});
