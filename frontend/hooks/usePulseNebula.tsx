import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { ethers } from "ethers";
import type { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import type { GenericStringStorage } from "@/fhevm/GenericStringStorage";
import { PulseNebulaHubABI } from "@/abi/PulseNebulaHubABI";
import { PulseNebulaHubAddresses } from "@/abi/PulseNebulaHubAddresses";
import { loadMeasurements, saveMeasurements, MeasurementEntry } from "@/lib/measurementStorage";

export type PulseSampleItem = {
  id: bigint;
  dataCID: string;
  timestamp: number;
  isPublic: boolean;
  publicAvgRate: number;
  measurementCount: number;
  minBpm: number;
  maxBpm: number;
  encryptedHandle: `0x${string}`;
  decryptedAvgRate?: bigint;
  measurements?: MeasurementEntry[];
};

export type CollectivePulseState = {
  encryptedSum?: `0x${string}`;
  encryptedCount?: `0x${string}`;
  decryptedAverage?: number;
};

type PulseNebulaContractInfo = {
  abi: typeof PulseNebulaHubABI;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

type SubmitPayload = {
  avgRate: number;
  dataCID: string;
  isPublic: boolean;
  publicAvgRate?: number;
  measurementCount: number;
  minBpm: number;
  maxBpm: number;
  measurements?: MeasurementEntry[];
};

function getPulseNebulaByChainId(chainId: number | undefined): PulseNebulaContractInfo {
  if (!chainId) {
    return { abi: PulseNebulaHubABI };
  }
  const entry = PulseNebulaHubAddresses[chainId.toString()];
  if (!entry || entry.address === ethers.ZeroAddress) {
    return { abi: PulseNebulaHubABI, chainId };
  }
  return {
    abi: PulseNebulaHubABI,
    address: entry.address,
    chainId: entry.chainId,
    chainName: entry.chainName,
  };
}

export function usePulseNebula(parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<(ethersSigner: ethers.JsonRpcSigner | undefined) => boolean>;
}) {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = parameters;

  const [samples, setSamples] = useState<PulseSampleItem[]>([]);
  const [collectivePulse, setCollectivePulse] = useState<CollectivePulseState>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string>("");

  const contractRef = useRef<PulseNebulaContractInfo | undefined>(undefined);
  const isLoadingRef = useRef<boolean>(false);

  const contractInfo = useMemo(() => {
    const info = getPulseNebulaByChainId(chainId);
    contractRef.current = info;
    if (!info.address) {
      setMessage(`PulseNebulaHub deployment not found. chainId=${chainId ?? "unknown"}`);
    }
    return info;
  }, [chainId]);

  const pulseNebulaContract = useMemo(() => {
    if (!contractInfo.address || !ethersReadonlyProvider) {
      return undefined;
    }
    return new ethers.Contract(contractInfo.address, contractInfo.abi, ethersReadonlyProvider);
  }, [contractInfo.address, contractInfo.abi, ethersReadonlyProvider]);

  const canInteract = useMemo(() => {
    return Boolean(contractInfo.address && instance && ethersSigner);
  }, [contractInfo.address, instance, ethersSigner]);

  const refresh = useCallback(async () => {
    if (!pulseNebulaContract || !ethersSigner) {
      setSamples([]);
      setCollectivePulse({});
      return;
    }
    if (isLoadingRef.current) {
      return;
    }
    isLoadingRef.current = true;
    setIsLoading(true);
    setMessage("Synchronizing nebula pulse data...");
    try {
      const userAddress = await ethersSigner.getAddress();
      const sampleIds: bigint[] = await pulseNebulaContract.listSamplesForUser(userAddress);
      const nextSamples: PulseSampleItem[] = [];

      for (const id of sampleIds) {
        const [metadata, sample] = await Promise.all([
          pulseNebulaContract.getSampleSynopsis(id),
          pulseNebulaContract.retrieveSample(id),
        ]);

        const encryptedHandle = ethers.hexlify(sample.encryptedAvgRate) as `0x${string}`;
        const measurements = await loadMeasurements(metadata.dataCID);

        nextSamples.push({
          id,
          dataCID: metadata.dataCID,
          isPublic: metadata.isPublic,
          publicAvgRate: Number(metadata.publicAvgRate),
          measurementCount: Number(metadata.measurementCount),
          minBpm: Number(metadata.minBpm),
          maxBpm: Number(metadata.maxBpm),
          timestamp: Number(metadata.timestamp),
          encryptedHandle,
          measurements,
        });
      }

      setSamples(nextSamples);

      const [encryptedSum, encryptedCount] = await pulseNebulaContract.collectivePulseHandles();
      setCollectivePulse({
        encryptedSum: ethers.hexlify(encryptedSum) as `0x${string}`,
        encryptedCount: ethers.hexlify(encryptedCount) as `0x${string}`,
      });
      setMessage("Pulse nebula data ready");
    } catch (error) {
      console.error(error);
      setMessage("Failed to fetch on-chain pulse data");
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [pulseNebulaContract, ethersSigner]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submitSample = useCallback(
    async (payload: SubmitPayload) => {
      if (
        !instance ||
        !ethersSigner ||
        !contractInfo.address ||
        !contractInfo.abi ||
        !payload.avgRate
      ) {
        setMessage("PulseNebula encryption environment is incomplete");
        return;
      }

      if (payload.avgRate < 30 || payload.avgRate > 220) {
        setMessage("Average pulse must be between 30 and 220");
        return;
      }

      setIsSubmitting(true);
      setMessage("Encrypting pulse sample via FHE...");

      const signer = ethersSigner;
      const run = async () => {
        const contractWithSigner = new ethers.Contract(
          contractInfo.address!,
          contractInfo.abi,
          signer
        );

        const input = instance.createEncryptedInput(contractInfo.address!, signer.address);
        input.add32(payload.avgRate);
        const encrypted = await input.encrypt();

        if (
          (typeof sameSigner.current === "function" && !sameSigner.current(signer)) ||
          (typeof sameChain.current === "function" && !sameChain.current(chainId))
        ) {
          setMessage("Chain or signer changed. Aborting submission.");
          return;
        }

        setMessage("Submitting transaction to PulseNebulaHub...");

        if (payload.measurements && payload.measurements.length > 0) {
          await saveMeasurements(payload.dataCID, payload.measurements);
        }

        const tx = await contractWithSigner.logPulseSample(
          payload.dataCID,
          encrypted.handles[0],
          encrypted.inputProof,
          payload.isPublic ? payload.publicAvgRate ?? payload.avgRate : 0,
          payload.measurementCount,
          payload.minBpm,
          payload.maxBpm,
          payload.isPublic
        );
        setMessage(`Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        setMessage(receipt?.status === 1 ? "Sample minted successfully" : "Transaction failed");

        await refresh();
      };

      try {
        await run();
      } catch (error) {
        console.error(error);
        setMessage("Sample submission failed. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      instance,
      ethersSigner,
      contractInfo.address,
      contractInfo.abi,
      sameSigner,
      sameChain,
      refresh,
      chainId,
    ]
  );

  const decryptSample = useCallback(
    async (sampleId: bigint) => {
      if (!instance || !ethersSigner || !contractInfo.address) {
        return;
      }

      const targetSample = samples.find((sample) => sample.id === sampleId);
      if (!targetSample) {
        return;
      }

      if (!targetSample.encryptedHandle || targetSample.encryptedHandle === ethers.ZeroHash) {
        return;
      }

      setMessage("Preparing to decrypt this pulse sample...");

      const run = async () => {
        const signature = await FhevmDecryptionSignature.loadOrSign(
          instance,
          [contractInfo.address!],
          ethersSigner,
          fhevmDecryptionSignatureStorage
        );

        if (!signature) {
          setMessage("Unable to generate decryption signature");
          return;
        }

        const res = await instance.userDecrypt(
          [{ handle: targetSample.encryptedHandle, contractAddress: contractInfo.address! }],
          signature.privateKey,
          signature.publicKey,
          signature.signature,
          signature.contractAddresses,
          signature.userAddress,
          signature.startTimestamp,
          signature.durationDays
        );

        const decryptedValue = res[targetSample.encryptedHandle] as bigint;

        setSamples((prev) =>
          prev.map((sample) =>
            sample.id === sampleId
              ? {
                  ...sample,
                  decryptedAvgRate: BigInt(decryptedValue),
                }
              : sample
          )
        );

        setMessage("Sample decrypted successfully");
      };

      try {
        await run();
      } catch (error) {
        console.error(error);
        setMessage("Sample decryption failed");
      }
    },
    [
      instance,
      ethersSigner,
      contractInfo.address,
      samples,
      fhevmDecryptionSignatureStorage,
    ]
  );

  const decryptCollectivePulse = useCallback(async () => {
    if (!instance || !ethersSigner || !contractInfo.address || !pulseNebulaContract) {
      return;
    }

    if (
      !collectivePulse.encryptedSum ||
      !collectivePulse.encryptedCount ||
      collectivePulse.encryptedSum === ethers.ZeroHash ||
      collectivePulse.encryptedCount === ethers.ZeroHash
    ) {
      setMessage("No collective statistics available for decryption");
      return;
    }

    setMessage("Requesting authority to decrypt collective stats...");

    try {
      const signerContract = pulseNebulaContract.connect(ethersSigner);
      const tx = await (signerContract as any).authorizeCollectivePulse();
      await tx.wait();
    } catch (error) {
      console.error(error);
      setMessage("Authorization failed. Unable to unlock collective stats.");
      return;
    }

    setMessage("Decrypting collective pulse statistics...");

    try {
      const signature = await FhevmDecryptionSignature.loadOrSign(
        instance,
        [contractInfo.address!],
        ethersSigner,
        fhevmDecryptionSignatureStorage
      );

      if (!signature) {
        setMessage("Unable to generate signature for collective stats");
        return;
      }

      const res = await instance.userDecrypt(
        [
          { handle: collectivePulse.encryptedSum, contractAddress: contractInfo.address! },
          { handle: collectivePulse.encryptedCount, contractAddress: contractInfo.address! },
        ],
        signature.privateKey,
        signature.publicKey,
        signature.signature,
        signature.contractAddresses,
        signature.userAddress,
        signature.startTimestamp,
        signature.durationDays
      );

      const sumKey = collectivePulse.encryptedSum!;
      const countKey = collectivePulse.encryptedCount!;

      const totalSum = Number((res[sumKey] ?? 0n) as bigint);
      const totalCount = Number((res[countKey] ?? 0n) as bigint);

      if (totalCount === 0) {
        setCollectivePulse((prev) => ({ ...prev, decryptedAverage: undefined }));
        setMessage("No collective samples available");
        return;
      }

      setCollectivePulse((prev) => ({
        ...prev,
        decryptedAverage: Math.round((totalSum / totalCount) * 10) / 10,
      }));
      setMessage("Collective statistics decrypted successfully");
    } catch (error) {
      console.error(error);
      setMessage("Failed to decrypt collective statistics");
    }
  }, [
    instance,
    ethersSigner,
    contractInfo.address,
    pulseNebulaContract,
    collectivePulse.encryptedSum,
    collectivePulse.encryptedCount,
    fhevmDecryptionSignatureStorage,
  ]);

  return {
    samples,
    collectivePulse,
    canInteract,
    isLoading,
    isSubmitting,
    message,
    contractAddress: contractInfo.address,
    submitSample,
    refresh,
    decryptSample,
    decryptCollectivePulse,
  };
}

