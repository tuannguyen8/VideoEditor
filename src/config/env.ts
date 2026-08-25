import "dotenv/config";

function getPositiveNumber(
  name: string,
  defaultValue: number
): number {
  const rawValue = process.env[name];

  if (rawValue === undefined) {
    return defaultValue;
  }

  const value = Number(rawValue);

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new Error(
      `Invalid environment variable ${name}: expected a positive number.`
    );
  }

  return value;
}

export const config = {
  port: getPositiveNumber(
    "PORT",
    3000
  ),

  highlightTtlMs:
    getPositiveNumber(
      "HIGHLIGHT_TTL_MINUTES",
      60
    ) *
    60 *
    1000,

  cleanupIntervalMs:
    getPositiveNumber(
      "CLEANUP_INTERVAL_MINUTES",
      10
    ) *
    60 *
    1000,

  maxUploadBytes:
    getPositiveNumber(
      "MAX_UPLOAD_MB",
      2048
    ) *
    1024 *
    1024
};