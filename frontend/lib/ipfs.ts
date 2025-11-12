export async function uploadEncryptedDataset(
  dataset: string
): Promise<string> {
  const { ethers } = await import("ethers");
  const hash = ethers.keccak256(ethers.toUtf8Bytes(dataset));
  return `bafy${hash.slice(4, 60)}`;
}

