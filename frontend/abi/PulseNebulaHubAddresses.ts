export const PulseNebulaHubAddresses: Record<
  string,
  {
    address: `0x${string}`;
    chainId: number;
    chainName: string;
    relayer?: {
      gatewayUrl?: string;
    };
  }
> = {
  "31337": {
    address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    chainId: 31337,
    chainName: "Localhost",
  },
  "11155111": {
    address: "0xcA40D08b58f438378A2da9a93C32D989BBD82Eca",
    chainId: 11155111,
    chainName: "Sepolia",
    relayer: {
      gatewayUrl: "https://gateway.testnet.zama.ai",
    },
  },
};

