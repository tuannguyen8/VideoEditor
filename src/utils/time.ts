export function timeToSeconds(time: string): number {
  const parts = time.split(":");

  if (parts.length !== 2) {
    throw new Error(
      `Invalid time format: "${time}". Use format M:SS, for example 1:35.`
    );
  }

  const minutes = Number(parts[0]);
  const seconds = Number(parts[1]);

  if (!Number.isInteger(minutes) || !Number.isInteger(seconds)) {
    throw new Error(
      `Invalid time: "${time}". Minutes and seconds must be whole numbers.`
    );
  }

  if (minutes < 0) {
    throw new Error(
      `Invalid time: "${time}". Minutes cannot be negative.`
    );
  }

  if (seconds < 0 || seconds > 59) {
    throw new Error(
      `Invalid time: "${time}". Seconds must be between 0 and 59.`
    );
  }

  return minutes * 60 + seconds;
}