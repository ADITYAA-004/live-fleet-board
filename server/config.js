const numberFromEnv = (name, fallback) => {
  const value = process.env[name];
  return value === undefined ? fallback : Number(value);
};

export const PORT = numberFromEnv("PORT", 8080);
export const BUS_COUNT = numberFromEnv("BUS_COUNT", 30);
export const NORMAL_HZ = numberFromEnv("NORMAL_HZ", 2);
export const BURST_MULTIPLIER = numberFromEnv("BURST_MULTIPLIER", 50);
export const BURST_DURATION_MS = numberFromEnv("BURST_DURATION_MS", 6000);
export const FIRST_BURST_DELAY_MS = numberFromEnv("FIRST_BURST_DELAY_MS", 45000);
export const BURST_INTERVAL_MS = numberFromEnv("BURST_INTERVAL_MS", 180000);
export const BURST_ON_START = process.env.BURST_ON_START === "1";
