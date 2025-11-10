"use client";

import { motion } from "framer-motion";
import { CollectivePulseState } from "@/hooks/usePulseNebula";

type Props = {
  stats: CollectivePulseState;
  onDecrypt: () => Promise<void>;
  disabled: boolean;
};

export function CollectivePulseCard({ stats, onDecrypt, disabled }: Props) {
  const hasAverage = typeof stats.decryptedAverage === "number";

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      className="shell-surface relative overflow-hidden px-8 py-8"
    >
      <motion.div
        className="pointer-events-none absolute -left-14 top-0 h-48 w-48 rounded-full bg-aurora/15 blur-[120px]"
        animate={{ opacity: [0.25, 0.45, 0.25], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 18, repeat: Infinity }}
      />
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-dusk/50">
              Collective Pulse
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-dusk">Collective pulse average</h2>
          </div>
          <p className="text-sm text-dusk/60">
            Collective averages remain encrypted until members grant access. Only aggregated data is exposed for governance decisions.
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-dusk/60">
            <span className="ghost-button border-clay/60 bg-white text-xs">
              Sum · {stats.encryptedSum ? `${stats.encryptedSum.slice(0, 12)}…` : "Pending"}
            </span>
            <span className="ghost-button border-clay/60 bg-white text-xs">
              Count · {stats.encryptedCount ? `${stats.encryptedCount.slice(0, 12)}…` : "Pending"}
            </span>
          </div>
        </div>
        <div className="sheet flex min-w-[240px] flex-col gap-3 rounded-3xl border-aurora/30 px-6 py-6 text-dusk">
          <p className="text-[10px] uppercase tracking-[0.35em] text-dusk/50">Nebula Mean</p>
          <p className="text-4xl font-semibold text-aurora">
            {hasAverage ? `${stats.decryptedAverage?.toFixed(1)} bpm` : "Locked"}
          </p>
          <p className="text-xs text-dusk/60">
            Call `authorizeCollectivePulse()` to decrypt these values with the FHEVM SDK.
          </p>
          <motion.button
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.97 }}
            onClick={() => onDecrypt()}
            disabled={disabled}
            className={`accent-button text-xs ${
              disabled ? "pointer-events-none opacity-50" : ""
            }`}
          >
            Unlock collective stats
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
}

