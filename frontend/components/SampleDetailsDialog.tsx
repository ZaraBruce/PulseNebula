"use client";

import { motion } from "framer-motion";
import { PulseSampleItem } from "@/hooks/usePulseNebula";

export type SampleDetailsDialogProps = {
  sample: PulseSampleItem | undefined;
  onClose: () => void;
};

export function SampleDetailsDialog({ sample, onClose }: SampleDetailsDialogProps) {
  if (!sample) return null;

  const measurements = sample.measurements ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="shell-surface w-full max-w-3xl px-8 py-8"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-dusk/50">Sample details</p>
            <h3 className="mt-3 text-2xl font-semibold text-dusk">
              Sample #{sample.id.toString().padStart(3, "0")}
            </h3>
          </div>
          <button onClick={onClose} className="ghost-button text-xs">
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4 rounded-3xl border border-clay/70 bg-white px-6 py-6 text-sm text-dusk/70">
          <div className="flex flex-wrap gap-4">
            <span>{sample.measurementCount} measurements</span>
            <span>Minimum {sample.minBpm} bpm</span>
            <span>Maximum {sample.maxBpm} bpm</span>
          </div>
          <div className="text-xs text-dusk/55">
            Uploaded {new Date(sample.timestamp * 1000).toLocaleString()}
          </div>
          <div className="font-mono text-xs text-dusk/60 break-words">
            IPFS CID · {sample.dataCID}
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-clay/70 bg-white">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-clay/60 text-left text-xs uppercase tracking-[0.32em] text-dusk/50">
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Pulse (bpm)</th>
              </tr>
            </thead>
            <tbody>
              {measurements.length === 0 ? (
                <tr>
                  <td className="px-5 py-8 text-center text-sm text-dusk/55" colSpan={2}>
                    No local measurement cache found. Check the IPFS payload or resubmit with local storage enabled.
                  </td>
                </tr>
              ) : (
                measurements.map((entry, index) => (
                  <tr key={`${entry.timestamp}-${index}`} className="border-b border-clay/40 text-sm">
                    <td className="px-5 py-3 text-dusk/70">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 font-semibold text-aurora">{entry.bpm}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-xs text-dusk/55">
          Note: measurement logs are cached locally. Use the CID `{sample.dataCID}` to resynchronize on a different device.
        </p>
      </motion.div>
    </div>
  );
}

