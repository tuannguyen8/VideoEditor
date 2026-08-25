import { app, outputDirectory } from "./app";

import { config } from "./config/env";

import { cleanupExpiredHighlights } from "./services/cleanupService";

const PORT = config.port;

const HIGHLIGHT_TTL_MS =
  config.highlightTtlMs;

const CLEANUP_INTERVAL_MS =
  config.cleanupIntervalMs;

cleanupExpiredHighlights( outputDirectory, HIGHLIGHT_TTL_MS ).catch((error) => {
  console.error(
    "Initial highlight cleanup failed:",
    error
  );
});

setInterval(() => {
  cleanupExpiredHighlights( outputDirectory, HIGHLIGHT_TTL_MS ).catch((error) => {
    console.error(
      "Scheduled highlight cleanup failed:",
      error
    );
  });
}, CLEANUP_INTERVAL_MS);

app.listen(PORT, () => {
  console.log(
    `Server is running on http://localhost:${PORT}`
  );
});

