export type Eip6963ProviderDetail = {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
};

export type Eip6963ProviderInfo = {
  info: Eip6963ProviderDetail;
  provider: ethers.Eip1193Provider;
};

import type { ethers } from "ethers";

