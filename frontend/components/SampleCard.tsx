"use client";

import { PulseSampleItem } from "@/hooks/usePulseNebula";
import { motion } from "framer-motion";

type SampleCardProps = {
  sample: PulseSampleItem;
  onDecrypt: (id: bigint) => Promise<void>;
  onViewDetails: (sample: PulseSampleItem) => void;
};

export function SampleCard({ sample, onDecrypt, onViewDetails }: SampleCardProps) {
  const decrypted = sample.decryptedAvgRate !== undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      className="sheet flex flex-col gap-4 rounded-3xl px-5 py-5 transition hover:border-aurora/40 hover:shadow-glow-aurora md:flex-row md:items-center md:justify-between"
    >
      <div className="flex w-full flex-col gap-3 md:max-w-[55%]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="badge">Sample #{sample.id.toString().padStart(3, "0")}</span>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              sample.isPublic ? "bg-willow/15 text-willow" : "bg-clay text-dusk/70"
            }`}
          >
            {sample.isPublic ? "Nebula contribution" : "Private storage"}
          </span>
          <span className="text-xs text-dusk/50">
            {new Date(sample.timestamp * 1000).toLocaleString()}
          </span>
        </div>
        <div className="grid gap-2 text-sm text-dusk/80">
          <div className="flex flex-wrap gap-4">
            <span>{sample.measurementCount} measurements</span>
            <span>Range {sample.minBpm} – {sample.maxBpm} bpm</span>
          </div>
          <p className="font-mono text-xs text-dusk/60 break-words">
            CID · {sample.dataCID}
          </p>
          <p className="font-mono text-xs text-dusk/50 break-words">
            Handle · {sample.encryptedHandle.slice(0, 12)}…{sample.encryptedHandle.slice(-6)}
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-3 md:max-w-[40%]">
        <div className="rounded-2xl border border-clay/70 bg-white px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.28em] text-dusk/50">Decrypted average</p>
          <p className="mt-2 text-2xl font-semibold text-dusk">
            {decrypted ? `${sample.decryptedAvgRate?.toString()} bpm` : "Pending decryption"}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button onClick={() => onViewDetails(sample)} className="ghost-button text-xs">
            View details
          </button>
          <button onClick={() => onDecrypt(sample.id)} className="accent-button text-xs">
            {decrypted ? "Unlocked" : "Decrypt sample"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

