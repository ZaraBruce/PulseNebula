import type { FhevmInstance } from "../fhevmTypes";
import type { Eip1193Provider } from "ethers";

export type FhevmRelayerSDKType = {
  initSDK: (options?: FhevmInitSDKOptions) => Promise<boolean>;
  createInstance: (config: FhevmInstanceConfig) => Promise<FhevmInstance>;
  SepoliaConfig: {
    aclContractAddress: `0x${string}`;
    gatewayUrl: string;
    kmsVerifierContractAddress: `0x${string}`;
    inputVerifierContractAddress: `0x${string}`;
    network: string;
    verifyingContractAddressDecryption: `0x${string}`;
    verifyingContractAddressInputVerification: `0x${string}`;
  };
  __initialized__?: boolean;
};

export type FhevmWindowType = Window &
  typeof globalThis & {
    relayerSDK: FhevmRelayerSDKType;
  };

export type FhevmInstanceConfig = {
  network: string | number | { url: string } | Eip1193Provider;
  publicKey?: string;
  publicParams?: string;
  aclContractAddress: `0x${string}`;
  kmsVerifierContractAddress: `0x${string}`;
  verifyingContractAddressDecryption: `0x${string}`;
  verifyingContractAddressInputVerification: `0x${string}`;
};

export type FhevmInitSDKOptions = {
  gatewayUrl?: string;
};

export type FhevmInitSDKType = (options?: FhevmInitSDKOptions) => Promise<boolean>;
export type FhevmLoadSDKType = () => Promise<void>;

