"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export type UploadCardProps = {
  disabled: boolean;
  processing: boolean;
  onSubmit: (payload: {
    avgRate: number;
    dataCID: string;
    isPublic: boolean;
    publicAvgRate?: number;
    measurementCount: number;
    minBpm: number;
    maxBpm: number;
    measurements?: Array<{ timestamp: string; bpm: number }>;
  }) => Promise<void>;
  onPrepareDataset: (raw: string) => Promise<{ avgRate: number; cid: string }>;
};

export function UploadCard({ disabled, processing, onSubmit, onPrepareDataset }: UploadCardProps) {
  type PulseEntry = {
    id: string;
    timestamp: string;
    bpm: string;
  };

  const createEntry = (offsetMinutes: number): PulseEntry => {
    const date = new Date(Date.now() - offsetMinutes * 60_000);
    const iso = date.toISOString().slice(0, 16);
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `entry-${Math.random().toString(36).slice(2)}`;
    return { id, timestamp: iso, bpm: "" };
  };

  const [entries, setEntries] = useState<PulseEntry[]>([
    createEntry(0),
    createEntry(5),
    createEntry(10),
  ]);
  const [mode, setMode] = useState<"public" | "private">("private");
  const [publicAvgRate, setPublicAvgRate] = useState<string>("");
  const [showImportPanel, setShowImportPanel] = useState<boolean>(false);

  const isPublic = mode === "public";

  useEffect(() => {
    if (!isPublic) {
      setPublicAvgRate("");
    }
  }, [isPublic]);

  const validBpmValues = useMemo(() => {
    return entries
      .map((entry) => Number(entry.bpm))
      .filter((value) => Number.isFinite(value) && value >= 30 && value <= 220);
  }, [entries]);

  const sanitizedMeasurements = useMemo(() => {
    return entries
      .map((entry) => ({
        timestamp: entry.timestamp,
        bpm: Number(entry.bpm),
      }))
      .filter((entry) => Number.isFinite(entry.bpm) && entry.bpm >= 30 && entry.bpm <= 220);
  }, [entries]);

  const stats = useMemo(() => {
    if (validBpmValues.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0 };
    }
    const sum = validBpmValues.reduce((acc, value) => acc + value, 0);
    const avg = Math.round(sum / validBpmValues.length);
    const min = Math.min(...validBpmValues);
    const max = Math.max(...validBpmValues);
    return { count: validBpmValues.length, avg, min, max };
  }, [validBpmValues]);

  const helperText = useMemo(() => {
    if (entries.every((entry) => entry.bpm === "")) {
      return "Add three to five pulse readings to try the encryption flow, or import a JSON array.";
    }
    return "Encryption and inputProof generation run locally. Review values before minting the sample.";
  }, [entries]);

  const addEntry = useCallback(() => {
    setEntries((prev) => [createEntry(0), ...prev]);
  }, []);

  const updateEntry = useCallback((id: string, key: "timestamp" | "bpm", value: string) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, [key]: value } : entry))
    );
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => (prev.length <= 1 ? prev : prev.filter((entry) => entry.id !== id)));
  }, []);

  const handleJsonImport = useCallback(() => {
    const raw = prompt("Paste a pulse JSON array exported from a wearable device, e.g. [72,74,70,68]");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Invalid JSON format");
      }
      const nextEntries = parsed
        .map((value: unknown, index: number) => {
          const bpm = Number(value);
          if (!Number.isFinite(bpm)) return undefined;
          return {
            ...createEntry(index * 5),
            bpm: String(Math.round(bpm)),
          };
        })
        .filter(Boolean) as PulseEntry[];
      if (nextEntries.length === 0) {
        throw new Error("No valid pulse values detected");
      }
      setEntries(nextEntries);
      toast.success(`Imported ${nextEntries.length} pulse entries`);
    } catch (error) {
      console.error(error);
      toast.error("Import failed. Please provide a valid JSON array.");
    }
  }, []);

  const computedPlaceholder = stats.count > 0 ? `Suggested: ${stats.avg} bpm` : "Leave blank to use average";

  const handleSubmit = useCallback(async () => {
    if (processing) {
      return;
    }
    if (disabled) {
      toast.error("Connect your wallet and ensure the FHEVM instance is ready.");
      return;
    }

    if (validBpmValues.length === 0) {
      toast.error("Provide at least one pulse measurement between 30 and 220 bpm.");
      return;
    }

    try {
      const datasetString = JSON.stringify(validBpmValues);
      const { avgRate, cid } = await onPrepareDataset(datasetString);
      const averageToUse = stats.count > 0 ? stats.avg : avgRate;

      const payload = {
        avgRate: averageToUse,
        dataCID: cid,
        isPublic,
        publicAvgRate: isPublic ? Number(publicAvgRate || averageToUse) : undefined,
        measurementCount: stats.count,
        minBpm: stats.count > 0 ? stats.min : 0,
        maxBpm: stats.count > 0 ? stats.max : 0,
        measurements: sanitizedMeasurements,
      };
      await onSubmit(payload);
      setEntries([createEntry(0), createEntry(5), createEntry(10)]);
      setPublicAvgRate("");
      toast.success("Pulse sample encrypted and submitted.");
    } catch (error) {
      console.error(error);
      toast.error("Processing failed. Please retry.");
    }
  }, [
    disabled,
    processing,
    onPrepareDataset,
    onSubmit,
    isPublic,
    publicAvgRate,
    stats.avg,
    stats.count,
    validBpmValues,
  ]);

  return (
    <div className="shell-surface flex flex-col gap-8 px-7 py-7">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-[0.45em] text-dusk/50">Nebula Ingest</p>
          <h2 className="text-3xl font-semibold text-dusk">PulseNebula sample ingest</h2>
          <p className="text-sm text-dusk/60">
            Enter or import pulse readings, perform FHE encryption in the browser, then send the transaction. Choose between contributing to collective stats or keeping the sample private.
          </p>
        </div>
        <div className="flex rounded-full border border-clay/70 bg-white p-1">
          <button
            className={`rounded-full px-4 py-1 text-xs font-semibold transition ${
              isPublic ? "bg-aurora text-white shadow-glow-aurora" : "text-dusk/60"
            }`}
            onClick={() => setMode("public")}
          >
            {isPublic ? "Nebula contribution" : "Private storage"}
          </button>
        </div>
      </div>

      <div className="sheet flex flex-col gap-4 rounded-3xl px-6 py-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-dusk">Pulse measurements</h3>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleJsonImport} className="ghost-button text-sm px-4 py-2">
              Import JSON
            </button>
            <button
              type="button"
              onClick={() => setShowImportPanel((prev) => !prev)}
              className="ghost-button text-sm px-4 py-2"
            >
              {showImportPanel ? "Hide example" : "Show example"}
            </button>
          </div>
        </div>

        {showImportPanel && (
          <div className="rounded-2xl border border-dashed border-aurora/40 bg-aurora/5 px-4 py-3 text-xs text-dusk/70">
            Example JSON: <code className="font-mono text-aurora">[72, 74, 70, 68, 75]</code>. Timestamps are generated automatically for each entry.
          </div>
        )}

        <div className="space-y-4">
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="flex flex-col gap-4 rounded-3xl border border-clay/70 bg-white px-5 py-5 shadow-lift-md md:flex-row md:items-end md:justify-between"
            >
              <div className="flex w-full flex-col gap-2 md:max-w-[55%]">
                <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-dusk/45">
                  Timestamp
                </label>
                <input
                  type="datetime-local"
                  value={entry.timestamp}
                  onChange={(event) => updateEntry(entry.id, "timestamp", event.target.value)}
                  disabled={processing}
                  className="rounded-2xl border border-clay/60 bg-white px-4 py-3 text-base font-medium text-dusk focus:border-aurora focus:outline-none focus:ring-2 focus:ring-aurora/40"
                />
              </div>
              <div className="flex w-full flex-col gap-2 md:max-w-[25%]">
                <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-dusk/45">
                  Pulse (bpm)
                </label>
                <input
                  type="number"
                  min={30}
                  max={220}
                  value={entry.bpm}
                  onChange={(event) => updateEntry(entry.id, "bpm", event.target.value)}
                  disabled={processing}
                  placeholder="72"
                  className="rounded-2xl border border-clay/60 bg-white px-4 py-3 text-base font-medium text-dusk focus:border-aurora focus:outline-none focus:ring-2 focus:ring-aurora/40"
                />
              </div>
              <button
                type="button"
                onClick={() => removeEntry(entry.id)}
                disabled={entries.length <= 1 || processing}
                className="ghost-button self-start text-xs disabled:opacity-40"
              >
                Remove
              </button>
              {index === entries.length - 1 && (
                <div className="hidden h-px w-full bg-gradient-to-r from-transparent via-aurora/20 to-transparent md:block" />
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addEntry}
          disabled={processing}
          className="ghost-button self-start text-sm"
        >
          + Add measurement
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="sheet rounded-3xl px-4 py-4">
          <p className="text-[10px] uppercase tracking-[0.32em] text-dusk/50">Records</p>
          <p className="mt-2 text-2xl font-semibold text-dusk">{stats.count}</p>
        </div>
        <div className="sheet rounded-3xl px-4 py-4">
          <p className="text-[10px] uppercase tracking-[0.32em] text-dusk/50">Average pulse</p>
          <p className="mt-2 text-2xl font-semibold text-dusk">
            {stats.count > 0 ? `${stats.avg} bpm` : "--"}
          </p>
        </div>
        <div className="sheet rounded-3xl px-4 py-4">
          <p className="text-[10px] uppercase tracking-[0.32em] text-dusk/50">Minimum pulse</p>
          <p className="mt-2 text-2xl font-semibold text-dusk">
            {stats.count > 0 ? `${stats.min}` : "--"}
          </p>
        </div>
        <div className="sheet rounded-3xl px-4 py-4">
          <p className="text-[10px] uppercase tracking-[0.32em] text-dusk/50">Maximum pulse</p>
          <p className="mt-2 text-2xl font-semibold text-dusk">
            {stats.count > 0 ? `${stats.max}` : "--"}
          </p>
        </div>
      </div>

      <p className="text-sm text-dusk/60">{helperText}</p>

      {isPublic && (
        <div className="sheet flex flex-col gap-2 rounded-3xl border-aurora/30 bg-aurora/8 px-5 py-5">
          <p className="text-sm font-semibold text-dusk">Optional public average</p>
          <input
            type="number"
            min={30}
            max={220}
            className="rounded-xl border border-clay/60 bg-white px-4 py-2 text-sm text-dusk focus:border-aurora focus:outline-none focus:ring-2 focus:ring-aurora/40"
            placeholder={computedPlaceholder}
            value={publicAvgRate}
            onChange={(event) => setPublicAvgRate(event.target.value)}
            disabled={processing}
          />
          <p className="text-xs text-dusk/50">Leave blank to use the calculated average.</p>
        </div>
      )}

      <motion.button
        whileHover={{ scale: processing ? 1 : 1.02 }}
        whileTap={{ scale: processing ? 1 : 0.97 }}
        className={`accent-button justify-center gap-2 text-base ${
          processing ? "cursor-wait opacity-70" : ""
        }`}
        onClick={handleSubmit}
        disabled={processing}
      >
        {processing ? "Encrypting and submitting..." : disabled ? "Connect wallet to continue" : "Mint sample"}
      </motion.button>
    </div>
  );
}

