"use client";

import { motion } from "framer-motion";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";

type WalletStatusProps = {
  compact?: boolean;
};

export function WalletStatus({ compact = false }: WalletStatusProps) {
  const { isConnected, accounts, connect, chainId } = useMetaMaskEthersSigner();

  if (!isConnected) {
    return (
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => connect()}
        className={compact ? "ghost-button text-xs" : "accent-button text-sm"}
      >
        Connect Wallet
      </motion.button>
    );
  }

  const account = accounts?.[0] ?? "";
  const shortAccount = `${account.slice(0, 6)}...${account.slice(-4)}`;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-full border border-clay/70 bg-white px-4 py-2 shadow-lift-md"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-willow shadow-[0_0_10px_rgba(82,183,136,0.6)]" />
        <span className="font-mono text-xs text-dusk">{shortAccount}</span>
        <span className="text-[10px] uppercase tracking-[0.28em] text-dusk/60">
          {chainId ?? "--"}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="sheet flex items-center gap-4 px-5 py-4"
    >
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 rounded-full bg-willow shadow-[0_0_14px_rgba(82,183,136,0.55)]" />
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-dusk/60">CONNECTED</p>
          <p className="font-mono text-sm text-dusk">{shortAccount}</p>
        </div>
      </div>
      <span className="badge">chain {chainId ?? "--"}</span>
    </motion.div>
  );
}

