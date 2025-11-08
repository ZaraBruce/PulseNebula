# PulseNebula Frontend

A PulseNebula FHE DApp built with Next.js + Tailwind, reusing integrations from `zama_template`:

- The local `hardhat` network automatically uses `@fhevm/mock-utils`.
- Deployments on Sepolia rely on the Relayer SDK for encryption and decryption.
- React client components handle encryption, on-chain interactions, and decryption flows.

## Development

```bash
pnpm install
pnpm dev
```

Runs at `http://localhost:3000` by default. Ensure the parent `contracts` project has the FHEVM-enabled Hardhat node running and deploy scripts executed to populate the latest addresses.

## Address Configuration

Edit `abi/PulseNebulaHubAddresses.ts`, replacing the `31337` and `11155111` addresses with your actual deployments. If you run your own Relayer, specify it in `relayer.gatewayUrl`.

## Core Modules

- `hooks/usePulseNebula.tsx`: encapsulates PulseNebulaHub interactions, FHE encryption/decryption, and collective stat authorization.
- `fhevm/`: shared FHEVM initialization logic supporting mock and Relayer modes.
- `components/`: UI building blocks for the nebula theme, including sample cards, collective statistics, and the upload panel.

## Mock / Relayer Switching

`hooks/metamask/useMetaMaskEthersSigner.tsx` injects local chain RPC endpoints via `initialMockChains`. When `useFhevm` detects chain ID 31337 it loads the mock; other networks (e.g. Sepolia) load the CDN Relayer SDK and reuse browser storage for public key parameters.

