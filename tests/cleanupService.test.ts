import {
  describe,
  expect,
  it
} from "vitest";

import {
  mkdtemp,
  writeFile,
  utimes,
  readdir,
  rm
} from "fs/promises";

import os from "os";
import path from "path";

import {
  cleanupExpiredHighlights
} from "../src/services/cleanupService";

describe("cleanupExpiredHighlights", () => {
  it("deletes expired highlights but keeps fresh and unrelated files", async () => {
    const tempDirectory = await mkdtemp(
      path.join(os.tmpdir(), "video-editor-test-")
    );

    try {
      const expiredHighlight = path.join(
        tempDirectory,
        "highlight_expired.mp4"
      );

      const freshHighlight = path.join(
        tempDirectory,
        "highlight_fresh.mp4"
      );

      const unrelatedFile = path.join(
        tempDirectory,
        "notes.txt"
      );

      await writeFile(
        expiredHighlight,
        "old highlight"
      );

      await writeFile(
        freshHighlight,
        "new highlight"
      );

      await writeFile(
        unrelatedFile,
        "do not delete"
      );

      // Make these files look 2 hours old.
      const oldTime = new Date(
        Date.now() - 2 * 60 * 60 * 1000
      );

      await utimes(
        expiredHighlight,
        oldTime,
        oldTime
      );

      await utimes(
        unrelatedFile,
        oldTime,
        oldTime
      );

      // TTL = 1 hour
      const ttlMs =
        60 * 60 * 1000;

      await cleanupExpiredHighlights(
        tempDirectory,
        ttlMs
      );

      const remainingFiles =
        await readdir(tempDirectory);

      expect(
        remainingFiles
      ).not.toContain(
        "highlight_expired.mp4"
      );

      expect(
        remainingFiles
      ).toContain(
        "highlight_fresh.mp4"
      );

      expect(
        remainingFiles
      ).toContain(
        "notes.txt"
      );

    } finally {
      await rm(tempDirectory, {
        recursive: true,
        force: true
      });
    }
  });
});