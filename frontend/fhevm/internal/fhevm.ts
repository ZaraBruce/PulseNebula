import { isAddress, Eip1193Provider, JsonRpcProvider } from "ethers";
import type {
  FhevmInitSDKOptions,
  FhevmInitSDKType,
  FhevmLoadSDKType,
  FhevmWindowType,
} from "./fhevmTypes";
import { isFhevmWindowType, RelayerSDKLoader } from "./RelayerSDKLoader";
import { publicKeyStorageGet, publicKeyStorageSet } from "./PublicKeyStorage";
import type { FhevmInstance } from "../fhevmTypes";
import type { FhevmInstanceConfig } from "./fhevmTypes";

export class FhevmReactError extends Error {
  code: string;
  constructor(code: string, message?: string, options?: { cause?: unknown }) {
    super(message);
    if (options && "cause" in options) {
      // @ts-expect-error: cause may not be supported in current TS/lib target
      this.cause = options.cause;
    }
    this.code = code;
    this.name = "FhevmReactError";
  }
}

function throwFhevmError(code: string, message?: string, cause?: unknown): never {
  throw new FhevmReactError(code, message, cause ? { cause } : undefined);
}

function toHexString(data: Uint8Array | undefined | null): string {
  if (!data || data.length === 0) return "";
  let hex = "0x";
  for (let i = 0; i < data.length; i++) {
    const b = data[i]?.toString(16).padStart(2, "0");
    hex += b;
  }
  return hex;
}

const isFhevmInitialized = (): boolean => {
  if (!isFhevmWindowType(window, console.log)) {
    return false;
  }
  return window.relayerSDK.__initialized__ === true;
};

const fhevmLoadSDK: FhevmLoadSDKType = () => {
  const loader = new RelayerSDKLoader({ trace: console.log });
  return loader.load();
};

const fhevmInitSDK: FhevmInitSDKType = async (options?: FhevmInitSDKOptions) => {
  if (!isFhevmWindowType(window, console.log)) {
    throw new Error("window.relayerSDK is not available");
  }
  const attempts: (FhevmInitSDKOptions | undefined)[] = [
    options,
    { gatewayUrl: "https://gateway.testnet.zama.ai" },
  ];
  for (const opts of attempts) {
    try {
      const result = await window.relayerSDK.initSDK(opts);
      if (result === true) {
        window.relayerSDK.__initialized__ = true;
        return true;
      }
    } catch (e) {
      // try next
    }
  }
  throw new Error("window.relayerSDK.initSDK failed after retries.");
};

function checkIsAddress(a: unknown): a is `0x${string}` {
  if (typeof a !== "string") {
    return false;
  }
  if (!isAddress(a)) {
    return false;
  }
  return true;
}

export class FhevmAbortError extends Error {
  constructor(message = "FHEVM operation was cancelled") {
    super(message);
    this.name = "FhevmAbortError";
  }
}

type FhevmRelayerStatusType =
  | "sdk-loading"
  | "sdk-loaded"
  | "sdk-initializing"
  | "sdk-initialized"
  | "creating";

async function getChainId(providerOrUrl: Eip1193Provider | string): Promise<number> {
  if (typeof providerOrUrl === "string") {
    const provider = new JsonRpcProvider(providerOrUrl);
    return Number((await provider.getNetwork()).chainId);
  }
  const chainId = await providerOrUrl.request({ method: "eth_chainId" });
  return Number.parseInt(chainId as string, 16);
}

async function getWeb3Client(rpcUrl: string) {
  const rpc = new JsonRpcProvider(rpcUrl);
  try {
    const version = await rpc.send("web3_clientVersion", []);
    return version;
  } catch (e) {
    throwFhevmError(
      "WEB3_CLIENTVERSION_ERROR",
      `The URL ${rpcUrl} is not a Web3 node or is not reachable. Please check the endpoint.`,
      e
    );
  } finally {
    rpc.destroy();
  }
}

async function tryFetchFHEVMHardhatNodeRelayerMetadata(rpcUrl: string): Promise<
  | {
      ACLAddress: `0x${string}`;
      InputVerifierAddress: `0x${string}`;
      KMSVerifierAddress: `0x${string}`;
    }
  | undefined
> {
  const version = await getWeb3Client(rpcUrl);
  if (typeof version !== "string" || !version.toLowerCase().includes("hardhat")) {
    return undefined;
  }
  try {
    const metadata = await getFHEVMRelayerMetadata(rpcUrl);
    if (!metadata || typeof metadata !== "object") {
      return undefined;
    }
    if (
      !(
        "ACLAddress" in metadata &&
        typeof metadata.ACLAddress === "string" &&
        metadata.ACLAddress.startsWith("0x")
      )
    ) {
      return undefined;
    }
    if (
      !(
        "InputVerifierAddress" in metadata &&
        typeof metadata.InputVerifierAddress === "string" &&
        metadata.InputVerifierAddress.startsWith("0x")
      )
    ) {
      return undefined;
    }
    if (
      !(
        "KMSVerifierAddress" in metadata &&
        typeof metadata.KMSVerifierAddress === "string" &&
        metadata.KMSVerifierAddress.startsWith("0x")
      )
    ) {
      return undefined;
    }
    return metadata as {
      ACLAddress: `0x${string}`;
      InputVerifierAddress: `0x${string}`;
      KMSVerifierAddress: `0x${string}`;
    };
  } catch {
    return undefined;
  }
}

async function getFHEVMRelayerMetadata(rpcUrl: string) {
  const rpc = new JsonRpcProvider(rpcUrl);
  try {
    const version = await rpc.send("fhevm_relayer_metadata", []);
    return version;
  } catch (e) {
    throwFhevmError(
      "FHEVM_RELAYER_METADATA_ERROR",
      `The URL ${rpcUrl} is not a FHEVM Hardhat node or is not reachable. Please check the endpoint.`,
      e
    );
  } finally {
    rpc.destroy();
  }
}

type MockResolveResult = { isMock: true; chainId: number; rpcUrl: string };
type GenericResolveResult = { isMock: false; chainId: number; rpcUrl?: string };
type ResolveResult = MockResolveResult | GenericResolveResult;

async function resolve(
  providerOrUrl: Eip1193Provider | string,
  mockChains?: Record<number, string>
): Promise<ResolveResult> {
  const chainId = await getChainId(providerOrUrl);

  let rpcUrl = typeof providerOrUrl === "string" ? providerOrUrl : undefined;

  const _mockChains: Record<number, string> = {
    31337: "http://localhost:8545",
    ...(mockChains ?? {}),
  };

  if (Object.prototype.hasOwnProperty.call(_mockChains, chainId)) {
    if (!rpcUrl) {
      rpcUrl = _mockChains[chainId];
    }

    return { isMock: true, chainId, rpcUrl };
  }

  return { isMock: false, chainId, rpcUrl };
}

export const createFhevmInstance = async (parameters: {
  provider: Eip1193Provider | string;
  mockChains?: Record<number, string>;
  signal: AbortSignal;
  onStatusChange?: (status: FhevmRelayerStatusType) => void;
}): Promise<FhevmInstance> => {
  const throwIfAborted = () => {
    if (signal.aborted) throw new FhevmAbortError();
  };

  const notify = (status: FhevmRelayerStatusType) => {
    if (onStatusChange) onStatusChange(status);
  };

  const { provider: providerOrUrl, mockChains, signal, onStatusChange } = parameters;

  const { isMock, rpcUrl, chainId } = await resolve(providerOrUrl, mockChains);

  if (isMock) {
    const fhevmRelayerMetadata = await tryFetchFHEVMHardhatNodeRelayerMetadata(rpcUrl);

    if (fhevmRelayerMetadata) {
      notify("creating");

      const fhevmMock = await import("./mock/fhevmMock");
      const mockInstance = await fhevmMock.fhevmMockCreateInstance({
        rpcUrl,
        chainId,
        metadata: fhevmRelayerMetadata,
      });

      throwIfAborted();

      return mockInstance;
    }
  }

  throwIfAborted();

  if (!isFhevmWindowType(window, console.log)) {
    notify("sdk-loading");
    await fhevmLoadSDK();
    throwIfAborted();
    notify("sdk-loaded");
  }

  if (!isFhevmInitialized()) {
    notify("sdk-initializing");
    await fhevmInitSDK();
    throwIfAborted();
    notify("sdk-initialized");
  }

  const relayerSDK = (window as unknown as FhevmWindowType).relayerSDK;

  const aclAddress = relayerSDK.SepoliaConfig.aclContractAddress;
  if (!checkIsAddress(aclAddress)) {
    throw new Error(`Invalid address: ${aclAddress}`);
  }

  const pub = await publicKeyStorageGet(aclAddress);
  throwIfAborted();

  const networkValue: string | { url: string } | Eip1193Provider =
    typeof providerOrUrl === "string"
      ? (/^https?:\/\//i.test(providerOrUrl) ? providerOrUrl : { url: providerOrUrl })
      : providerOrUrl;
  
  // Extract SepoliaConfig and remove any existing publicKey/publicParams
  const { publicKey: _pk, publicParams: _pp, network: _n, ...sepoliaConfigBase } = relayerSDK.SepoliaConfig as any;
  
  // Build config, only adding publicKey/publicParams if they have valid values
  const config: any = {
    ...sepoliaConfigBase,
    network: networkValue,
  };
  
  if (pub.publicKey && pub.publicKey !== "") {
    config.publicKey = pub.publicKey;
  }
  
  if (pub.publicParams && pub.publicParams !== "") {
    config.publicParams = pub.publicParams;
  }

  console.log("[createFhevmInstance] Creating instance with config:", {
    ...config,
    network: typeof config.network === "object" ? "Eip1193Provider" : config.network,
    publicKey: config.publicKey ? `${config.publicKey.substring(0, 20)}...` : "undefined",
    publicParams: config.publicParams ? `${config.publicParams.substring(0, 20)}...` : "undefined",
  });

  notify("creating");

  const instance = await relayerSDK.createInstance(config);

  const pkRaw = instance.getPublicKey() as unknown;
  const pkStr =
    typeof pkRaw === "string"
      ? pkRaw
      : toHexString((pkRaw as { publicKey?: Uint8Array | null } | null | undefined)?.publicKey ?? undefined);
  const ppRaw = instance.getPublicParams(2048) as unknown;
  const ppStr =
    typeof ppRaw === "string"
      ? ppRaw
      : toHexString((ppRaw as { data?: Uint8Array | null } | null | undefined)?.data ?? undefined);
  await publicKeyStorageSet(aclAddress, pkStr, ppStr);

  throwIfAborted();

  return instance;
};

