"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { usePulseNebulaApp } from "@/hooks/usePulseNebulaApp";
import { SampleCard } from "@/components/SampleCard";
import { SampleDetailsDialog } from "@/components/SampleDetailsDialog";
import type { PulseSampleItem } from "@/hooks/usePulseNebula";

export default function DashboardPage() {
  const { connect, isConnected, statusBadge, chainId, pulseNebula } = usePulseNebulaApp();
  const [viewingSample, setViewingSample] = useState<PulseSampleItem | undefined>(undefined);

  const latestSample = useMemo(() => {
    if (pulseNebula.samples.length === 0) return undefined;
    return pulseNebula.samples.slice().sort((a, b) => b.timestamp - a.timestamp)[0];
  }, [pulseNebula.samples]);

  const totalMeasurements = useMemo(
    () => pulseNebula.samples.reduce((acc, sample) => acc + sample.measurementCount, 0),
    [pulseNebula.samples]
  );

  const averageDisplay = pulseNebula.collectivePulse.decryptedAverage
    ? `${pulseNebula.collectivePulse.decryptedAverage.toFixed(1)} bpm`
    : "Locked";

  const connectWallet = () => {
    if (!isConnected) connect();
  };

  return (
    <div className="space-y-8">
      <section className="shell-surface flex flex-col gap-6 px-8 py-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-5 lg:max-w-xl">
          <span className="pill">On-chain FHE pulse nebula</span>
          <h1 className="text-4xl font-semibold text-dusk sm:text-5xl">
            Connect to PulseNebula, manage private samples, and unlock insights.
          </h1>
          <p className="text-sm text-dusk/65">
            The local Hardhat mode uses the FHE mock; connecting to Sepolia automatically switches to the Relayer. Samples remain encrypted and require explicit authorization to reveal plaintext.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={connectWallet} className="accent-button text-sm">
              {isConnected ? "Wallet connected" : "Connect wallet"}
            </button>
            <Link href="/upload" className="ghost-button text-sm">
              Create encrypted sample
            </Link>
            <span className="pill">{statusBadge}</span>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="sheet flex min-w-[280px] flex-col gap-4 rounded-3xl px-6 py-6 text-dusk"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-dusk/55">Current chain</p>
            <span className="badge">chain {chainId ?? "--"}</span>
          </div>
          <div className="rounded-2xl border border-clay/70 bg-white px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.32em] text-dusk/50">Latest sample</p>
            <p className="mt-2 text-sm text-dusk">
              {latestSample ? new Date(latestSample.timestamp * 1000).toLocaleString() : "Awaiting upload"}
            </p>
          </div>
          <div className="rounded-2xl border border-clay/70 bg-white px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.32em] text-dusk/50">Collective average</p>
            <p className="mt-2 text-2xl font-semibold text-aurora">{averageDisplay}</p>
            <p className="text-xs text-dusk/55">Call `authorizeCollectivePulse()` to decrypt collective stats.</p>
          </div>
        </motion.div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="sheet rounded-3xl px-5 py-5">
          <p className="text-[10px] uppercase tracking-[0.32em] text-dusk/55">Total samples</p>
          <p className="mt-3 text-3xl font-semibold text-dusk">
            {pulseNebula.samples.length.toString().padStart(2, "0")}
          </p>
          <p className="mt-2 text-sm text-dusk/60">All samples are stored as euint32 values and are ready for advanced analytics.</p>
          <Link href="/vault" className="ghost-button mt-4 inline-flex text-xs">
            Manage samples
          </Link>
        </div>
        <div className="sheet rounded-3xl px-5 py-5">
          <p className="text-[10px] uppercase tracking-[0.32em] text-dusk/55">Total measurements</p>
          <p className="mt-3 text-3xl font-semibold text-dusk">{totalMeasurements}</p>
          <p className="mt-2 text-sm text-dusk/60">Includes locally cached logs to replay pulse curves when needed.</p>
        </div>
        <div className="sheet rounded-3xl px-5 py-5">
          <p className="text-[10px] uppercase tracking-[0.32em] text-dusk/55">Nebula status</p>
          <p className="mt-3 text-3xl font-semibold text-aurora">{averageDisplay}</p>
          <p className="mt-2 text-sm text-dusk/60">Unlock the statistics and explore collective trends on the insights page.</p>
          <Link href="/insight" className="accent-button mt-4 inline-flex text-xs">
            View insights
          </Link>
        </div>
      </section>

      <section className="shell-surface px-7 py-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-dusk">Recent samples</h2>
            <p className="text-sm text-dusk/60">Decryption runs in the browser only; data never leaves the device.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => pulseNebula.refresh()} className="ghost-button text-xs">
              Refresh
            </button>
            <button onClick={() => pulseNebula.decryptCollectivePulse()} className="ghost-button text-xs">
              Request collective unlock
            </button>
          </div>
        </div>

        {pulseNebula.samples.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-clay/80 bg-white px-6 py-10 text-center text-dusk/60">
            No samples yet. Head to <Link href="/upload" className="text-aurora underline-offset-4 hover:underline">Sample Ingest</Link> to mint your first encrypted record.
          </div>
        ) : (
          <div className="mt-8 grid gap-5">
            {pulseNebula.samples.slice(0, 4).map((sample) => (
              <SampleCard
                key={sample.id.toString()}
                sample={sample}
                onDecrypt={pulseNebula.decryptSample}
                onViewDetails={(target) => setViewingSample(target)}
              />
            ))}
          </div>
        )}
      </section>

      {pulseNebula.message && (
        <div className="sheet border border-aurora/30 bg-aurora/8 px-6 py-4 text-sm text-dusk">
          <span className="font-semibold text-aurora">System message:</span> {pulseNebula.message}
        </div>
      )}

      <SampleDetailsDialog sample={viewingSample} onClose={() => setViewingSample(undefined)} />
    </div>
  );
}

