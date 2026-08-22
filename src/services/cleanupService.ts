import {
  readdir,
  stat,
  rm
} from "fs/promises";

import path from "path";

export async function cleanupExpiredHighlights(
  outputDirectory: string,
  ttlMs: number
): Promise<void> {
  const files = await readdir(
    outputDirectory,
    {
      withFileTypes: true
    }
  );

  const now = Date.now();

  for (const file of files) {
    if (!file.isFile()) {
      continue;
    }

    if (
      !file.name.startsWith("highlight_") ||
      !file.name.endsWith(".mp4")
    ) {
      continue;
    }

    const filePath = path.join(
      outputDirectory,
      file.name
    );

    const fileStats =
      await stat(filePath);

    const age =
      now - fileStats.mtimeMs;

    if (age >= ttlMs) {
      await rm(filePath, {
        force: true
      });

      console.log(
        `TTL cleanup deleted: ${file.name}`
      );
    }
  }
}