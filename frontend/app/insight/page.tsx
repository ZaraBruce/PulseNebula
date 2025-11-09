"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { usePulseNebulaApp } from "@/hooks/usePulseNebulaApp";
import { CollectivePulseCard } from "@/components/CollectivePulseCard";

type TrendPoint = {
  label: string;
  value: number;
};

function buildWeeklyTrend(timestamps: number[]): TrendPoint[] {
  const now = new Date();
  const points: TrendPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    const count = timestamps.filter((ts) => ts * 1000 >= start.getTime() && ts * 1000 < end.getTime()).length;

    points.push({
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      value: count,
    });
  }
  return points;
}

export default function InsightPage() {
  const { pulseNebula } = usePulseNebulaApp();

  const weeklyTrend = useMemo(
    () => buildWeeklyTrend(pulseNebula.samples.map((sample) => sample.timestamp)),
    [pulseNebula.samples]
  );

  const publicSamples = useMemo(
    () => pulseNebula.samples.filter((sample) => sample.isPublic),
    [pulseNebula.samples]
  );

  const unlockAnalytics = async () => {
    await pulseNebula.decryptCollectivePulse();
  };

  return (
    <div className="space-y-10">
      <section className="shell-surface px-8 py-9">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-4 max-w-2xl">
            <span className="pill">Nebula Insights</span>
            <h1 className="text-4xl font-semibold text-dusk sm:text-5xl">
              Unlock anonymous nebula pulse trends
            </h1>
            <p className="text-sm text-dusk/60">
              Only members who opt in share their averages. Plaintext remains under personal control, and decrypted insights support health metrics, governance, and rewards.
            </p>
          </div>
          <button onClick={unlockAnalytics} className="accent-button text-sm">
            Unlock collective stats
          </button>
        </div>
      </section>

      <CollectivePulseCard
        stats={pulseNebula.collectivePulse}
        onDecrypt={unlockAnalytics}
        disabled={!pulseNebula.canInteract || pulseNebula.isSubmitting}
      />

      <section className="shell-surface px-7 py-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-dusk">7-day upload frequency</h2>
            <p className="text-sm text-dusk/60">Daily sample submissions help track the activity of PulseNebula.</p>
          </div>
        </div>
        <div className="mt-8 flex h-64 items-end gap-3">
          {weeklyTrend.map((point) => (
            <div key={point.label} className="flex w-full flex-col items-center gap-3">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${point.value * 22 + 12}px` }}
                transition={{ duration: 0.6, type: "spring" }}
                className="w-full rounded-2xl bg-aurora/20"
                title={`${point.label}: ${point.value} samples`}
              />
              <p className="text-xs font-semibold text-dusk/60">{point.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="shell-surface px-7 py-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-dusk">Contribution overview</h2>
            <p className="text-sm text-dusk/60">Anonymous members contributing averages and the overall sample count indicate the level of collaboration.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <div className="sheet rounded-3xl px-5 py-5">
            <p className="text-[10px] uppercase tracking-[0.32em] text-dusk/50">Contributing members</p>
            <p className="mt-2 text-3xl font-semibold text-dusk">
              {publicSamples.length.toString().padStart(2, "0")}
            </p>
            <p className="mt-2 text-sm text-dusk/60">Counts addresses that voluntarily share averages while remaining anonymous.</p>
          </div>
          <div className="sheet rounded-3xl px-5 py-5">
            <p className="text-[10px] uppercase tracking-[0.32em] text-dusk/50">Total samples</p>
            <p className="mt-2 text-3xl font-semibold text-dusk">
              {pulseNebula.samples.length.toString().padStart(2, "0")}
            </p>
            <p className="mt-2 text-sm text-dusk/60">Includes private samples to gauge the nebula's activity.</p>
          </div>
          <div className="sheet rounded-3xl px-5 py-5">
            <p className="text-[10px] uppercase tracking-[0.32em] text-dusk/50">System message</p>
            <p className="mt-2 text-sm text-dusk/60">
              {pulseNebula.message || "Decrypt the collective statistics to reveal nebula averages and additional metrics."}
            </p>
          </div>
        </div>
      </section>

      <section className="shell-surface px-7 py-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-dusk">Contribution leaderboard</h2>
            <p className="text-sm text-dusk/60">Anonymous contributors provide averages that can power rewards or governance scoring.</p>
          </div>
        </div>
        {publicSamples.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-clay/80 bg-white px-6 py-10 text-center text-dusk/60">
            No public contributions yet. Encourage members to enable "Nebula contribution" when uploading to expand the data set.
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {publicSamples.map((sample, index) => (
              <div key={sample.id.toString()} className="sheet rounded-3xl px-6 py-5 text-sm text-dusk/75">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-dusk">#{index + 1} Anonymous member</span>
                  <span className="badge">Average {sample.publicAvgRate || "--"} bpm</span>
                </div>
                <p className="mt-2 text-xs text-dusk/55">
                  {new Date(sample.timestamp * 1000).toLocaleString()}
                </p>
                <p className="mt-3 font-mono text-xs text-dusk/60">
                  Handle: {sample.encryptedHandle.slice(0, 12)}…{sample.encryptedHandle.slice(-6)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

