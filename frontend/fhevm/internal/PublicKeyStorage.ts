const STORAGE_KEY_PREFIX = "__pulsenebula_fhevm_pubkey__";

type PublicKeyEntry = {
  publicKey: string;
  publicParams: string;
};

function buildKey(aclAddress: string): string {
  return `${STORAGE_KEY_PREFIX}:${aclAddress.toLowerCase()}`;
}

export async function publicKeyStorageGet(
  aclAddress: string
): Promise<PublicKeyEntry> {
  if (typeof window === "undefined") {
    return { publicKey: "", publicParams: "" };
  }
  const existing = window.localStorage.getItem(buildKey(aclAddress));
  if (!existing) {
    return { publicKey: "", publicParams: "" };
  }
  try {
    return JSON.parse(existing) as PublicKeyEntry;
  } catch {
    return { publicKey: "", publicParams: "" };
  }
}

export async function publicKeyStorageSet(
  aclAddress: string,
  publicKey: string,
  publicParams: string
): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(
    buildKey(aclAddress),
    JSON.stringify({ publicKey, publicParams })
  );
}

