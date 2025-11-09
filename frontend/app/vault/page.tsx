"use client";

import { useMemo, useState } from "react";
import { usePulseNebulaApp } from "@/hooks/usePulseNebulaApp";
import { SampleCard } from "@/components/SampleCard";
import { SampleDetailsDialog } from "@/components/SampleDetailsDialog";
import type { PulseSampleItem } from "@/hooks/usePulseNebula";

export default function VaultPage() {
  const { pulseNebula } = usePulseNebulaApp();

  const sortedSamples = useMemo(
    () =>
      pulseNebula.samples
        .slice()
        .sort((a, b) => b.timestamp - a.timestamp),
    [pulseNebula.samples]
  );

  const [selectedSample, setSelectedSample] = useState<PulseSampleItem | undefined>(undefined);

  const totalMeasurements = useMemo(
    () => sortedSamples.reduce((acc, sample) => acc + sample.measurementCount, 0),
    [sortedSamples]
  );

  return (
    <div className="space-y-10">
      <section className="shell-surface px-8 py-9">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-5">
            <span className="pill">Nebula Vault</span>
            <h1 className="text-4xl font-semibold text-dusk sm:text-5xl">Manage my pulse vault</h1>
            <p className="text-sm text-dusk/60">
              Review encrypted samples, decrypt locally, refresh on-chain state, and plan authorization strategy. All decryptions run inside the browser.
            </p>
            <p className="text-xs text-dusk/50">
              Currently storing {sortedSamples.length} samples covering {totalMeasurements} pulse measurements.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => pulseNebula.refresh()} className="ghost-button text-xs">
                Refresh on-chain data
              </button>
              <button onClick={() => pulseNebula.decryptCollectivePulse()} className="ghost-button text-xs">
                Unlock collective stats
              </button>
            </div>
          </div>

          <div className="sheet rounded-3xl px-6 py-6 text-sm text-dusk/70">
            <p className="text-[10px] uppercase tracking-[0.32em] text-dusk/50">Vault snapshot</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-clay/70 bg-white px-4 py-3">
                <p className="text-xs text-dusk/50">Sample count</p>
                <p className="mt-1 text-2xl font-semibold text-dusk">
                  {sortedSamples.length.toString().padStart(2, "0")}
                </p>
              </div>
              <div className="rounded-2xl border border-clay/70 bg-white px-4 py-3">
                <p className="text-xs text-dusk/50">Latest handle</p>
                <p className="mt-1 font-mono text-xs text-dusk/60">
                  {sortedSamples[0]
                    ? `${sortedSamples[0].encryptedHandle.slice(0, 12)}…${sortedSamples[0].encryptedHandle.slice(-6)}`
                    : "--"}
                </p>
              </div>
              <div className="rounded-2xl border border-clay/70 bg-white px-4 py-3">
                <p className="text-xs text-dusk/50">Nebula contributions</p>
                <p className="mt-1 text-lg font-semibold text-aurora">
                  {sortedSamples.filter((sample) => sample.isPublic).length} samples
                </p>
              </div>
            </div>
            <p className="mt-5 text-xs text-dusk/55">
              Tip: call `grantSampleAccess` on the contract to authorize third parties. UI support for delegation will arrive in a future release.
            </p>
          </div>
        </div>
      </section>

      <section className="shell-surface px-7 py-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-dusk">Encrypted samples</h2>
            <p className="text-sm text-dusk/60">“Decrypt sample” uses cached or freshly generated FHE signatures locally on this device.</p>
          </div>
        </div>

        {sortedSamples.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-clay/80 bg-white px-6 py-10 text-center text-dusk/60">
            No samples yet. Visit <button onClick={() => (window.location.href = "/upload")} className="text-aurora underline-offset-4 hover:underline">Sample Ingest</button> to mint your first encrypted record.
          </div>
        ) : (
          <div className="mt-10 grid gap-6">
            {sortedSamples.map((sample) => (
              <SampleCard
                key={sample.id.toString()}
                sample={sample}
                onDecrypt={pulseNebula.decryptSample}
                onViewDetails={(target) => setSelectedSample(target)}
              />
            ))}
          </div>
        )}
      </section>

      <SampleDetailsDialog sample={selectedSample} onClose={() => setSelectedSample(undefined)} />
    </div>
  );
}

