export type MeasurementEntry = {
  timestamp: string;
  bpm: number;
};

const STORAGE_PREFIX = "__pulsenebula_measurements__";

function getKey(cid: string): string {
  return `${STORAGE_PREFIX}:${cid}`;
}

export async function saveMeasurements(
  cid: string,
  measurements: MeasurementEntry[]
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getKey(cid), JSON.stringify(measurements));
  } catch (error) {
    console.warn("Failed to save measurements", error);
  }
}

export async function loadMeasurements(cid: string): Promise<MeasurementEntry[] | undefined> {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(getKey(cid));
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return undefined;
    return parsed
      .map((entry) =>
        entry && typeof entry === "object" && typeof entry.timestamp === "string" && typeof entry.bpm === "number"
          ? { timestamp: entry.timestamp, bpm: entry.bpm }
          : undefined
      )
      .filter(Boolean) as MeasurementEntry[];
  } catch (error) {
    console.warn("Failed to load measurements", error);
    return undefined;
  }
}

