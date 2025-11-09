"use client";

import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";
import { usePulseNebulaApp } from "@/hooks/usePulseNebulaApp";
import { UploadCard } from "@/components/UploadCard";
import { uploadEncryptedDataset } from "@/lib/ipfs";

export default function UploadPage() {
  const { pulseNebula, isConnected, connect, statusBadge } = usePulseNebulaApp();

  async function prepareDataset(raw: string) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("Pulse data must be a JSON array, e.g. [72,74,70]");
    }
    if (!Array.isArray(parsed)) {
      throw new Error("Provide an array of pulse readings");
    }
    const filtered = parsed
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 30 && value < 220);
    if (filtered.length === 0) {
      throw new Error("No valid pulse values detected (30-220)");
    }
    const avgRate = Math.round(filtered.reduce((sum, value) => sum + value, 0) / filtered.length);
    const cid = await uploadEncryptedDataset(JSON.stringify(filtered));
    return { avgRate, cid };
  }

  const handleSubmit = async (payload: Parameters<typeof pulseNebula.submitSample>[0]) => {
    if (!pulseNebula.canInteract) {
      toast.error("FHEVM environment is not ready. Check your chain and wallet status.");
      return;
    }
    await pulseNebula.submitSample(payload);
  };

  return (
    <div className="space-y-10">
      <section className="shell-surface overflow-hidden px-8 py-10">
        <motion.div
          className="pointer-events-none absolute -top-20 left-[-10%] h-72 w-72 rounded-full bg-aurora/15 blur-[140px]"
          animate={{ opacity: [0.2, 0.45, 0.2], scale: [0.9, 1.05, 0.9] }}
          transition={{ duration: 18, repeat: Infinity }}
        />
        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="space-y-6">
            <span className="pill">PulseNebula Upload</span>
            <h1 className="text-4xl font-semibold text-dusk sm:text-5xl">Mint a new pulse sample</h1>
            <p className="text-sm text-dusk/60">
              Enter readings manually, import from wearables, or sync via scripts. Encryption happens locally before the transaction is sent, keeping plaintext entirely off-chain.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              {[{
                title: "Import pulse sequence",
                desc: "Paste JSON/CSV or use device APIs directly.",
              },
              {
                title: "Encrypt the average",
                desc: "Generate ciphertext and inputProof with the FHEVM SDK.",
              },
              {
                title: "IPFS & on-chain record",
                desc: "Store only the CID and encrypted average; keep plaintext local.",
              },
              {
                title: "Flexible authorization",
                desc: "Choose between collective contribution or private access only.",
              }].map((item, index) => (
                <div key={item.title} className="sheet rounded-3xl border border-clay/70 px-5 py-5 text-sm text-dusk/70">
                  <span className="badge">Step {index + 1}</span>
                  <p className="mt-3 text-base font-semibold text-dusk">{item.title}</p>
                  <p className="mt-2 text-xs text-dusk/60">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="pill">{statusBadge}</span>
              {!isConnected && (
                <button onClick={() => connect()} className="accent-button text-xs">
                  Connect wallet
                </button>
              )}
              <Link href="/dashboard" className="ghost-button text-xs">
                Back to overview
              </Link>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <UploadCard
              disabled={!pulseNebula.canInteract}
              processing={pulseNebula.isSubmitting}
              onPrepareDataset={prepareDataset}
              onSubmit={handleSubmit}
            />
          </motion.div>
        </div>
      </section>

      <section className="shell-surface px-7 py-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-dusk">Security notes</h2>
            <p className="text-sm text-dusk/60">
              Homomorphic encryption runs entirely on the client; PulseNebulaHub only stores ciphertext handles and essential metadata.
            </p>
          </div>
          <button onClick={() => pulseNebula.refresh()} className="ghost-button text-xs">
            Refresh on-chain state
          </button>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[{
            title: "FHE encryption",
            body: "Averages are stored as euint32 values; only the contract and authorized addresses can decrypt.",
          },
          {
            title: "IPFS storage",
            body: "Replace the mock with a real uploader at any time; plaintext currently lives in local storage.",
          },
          {
            title: "Privacy modes",
            body: "Opt into collective contribution without exposing raw data; decryption still requires explicit consent.",
          },
          {
            title: "Decryption signature cache",
            body: "Browser caches signatures for a year; clear or regenerate whenever needed.",
          }].map((item) => (
            <div key={item.title} className="sheet rounded-3xl px-5 py-5 text-sm text-dusk/65">
              <p className="text-[10px] uppercase tracking-[0.32em] text-dusk/50">{item.title}</p>
              <p className="mt-3">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {pulseNebula.message && (
        <div className="sheet border border-aurora/30 bg-aurora/8 px-6 py-4 text-sm text-dusk">
          <span className="font-semibold text-aurora">System message:</span> {pulseNebula.message}
        </div>
      )}
    </div>
  );
}

