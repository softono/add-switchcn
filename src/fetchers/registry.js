import path from "node:path";
import { REGISTRY_BASE_URL } from "../constants/registry.js";

export function validateRegistryFilePath(filename) {
  if (typeof filename !== "string" || filename.length === 0) {
    throw new Error("Invalid file path in SwitchCN registry.");
  }

  const normalized = filename.replaceAll("\\", "/");
  if (
    normalized.startsWith("/") ||
    normalized.split("/").includes("..") ||
    path.posix.normalize(normalized) !== normalized
  ) {
    throw new Error("Invalid file path in SwitchCN registry.");
  }

  return normalized;
}

export async function fetchRegistry(fetchImpl = fetch) {
  try {
    const response = await fetchImpl(`${REGISTRY_BASE_URL}/registry-item.json`);
    if (!response.ok) {
      throw new Error();
    }

    const registry = await response.json();
    if (!Array.isArray(registry.files) || !Array.isArray(registry.dependencies)) {
      throw new Error();
    }

    registry.files = registry.files.map(validateRegistryFilePath);
    return registry;
  } catch {
    throw new Error("Failed to fetch SwitchCN registry.");
  }
}

export async function downloadRegistryFiles(files, fetchImpl = fetch) {
  return Promise.all(
    files.map(async (filename) => {
      const encodedPath = filename.split("/").map(encodeURIComponent).join("/");
      const response = await fetchImpl(`${REGISTRY_BASE_URL}/${encodedPath}`);

      if (!response.ok) {
        throw new Error(`Failed to download SwitchCN file: ${filename}`);
      }

      return {
        filename,
        contents: await response.text(),
      };
    }),
  );
}
