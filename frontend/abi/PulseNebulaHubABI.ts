export const PulseNebulaHubABI = [
  {
    inputs: [
      {
        internalType: "string",
        name: "dataCID",
        type: "string",
      },
      {
        internalType: "externalEuint32",
        name: "avgRateExt",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "inputProof",
        type: "bytes",
      },
      {
        internalType: "uint32",
        name: "publicAvgRate",
        type: "uint32",
      },
      {
        internalType: "uint32",
        name: "measurementCount",
        type: "uint32",
      },
      {
        internalType: "uint32",
        name: "minBpm",
        type: "uint32",
      },
      {
        internalType: "uint32",
        name: "maxBpm",
        type: "uint32",
      },
      {
        internalType: "bool",
        name: "isPublic",
        type: "bool",
      },
    ],
    name: "logPulseSample",
    outputs: [
      {
        internalType: "uint256",
        name: "sampleId",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "recordId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "viewer",
        type: "address",
      },
    ],
    name: "grantSampleAccess",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "authorizeCollectivePulse",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "sampleId",
        type: "uint256",
      },
    ],
    name: "retrieveSample",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "user",
            type: "address",
          },
          {
            internalType: "string",
            name: "dataCID",
            type: "string",
          },
          {
            internalType: "euint32",
            name: "encryptedAvgRate",
            type: "bytes32",
          },
          {
            internalType: "uint32",
            name: "publicAvgRate",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "measurementCount",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "minBpm",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "maxBpm",
            type: "uint32",
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "isPublic",
            type: "bool",
          },
        ],
        internalType: "struct PulseNebulaHub.PulseSample",
        name: "sample",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "listSamplesForUser",
    outputs: [
      {
        internalType: "uint256[]",
        name: "sampleIds",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "collectivePulseHandles",
    outputs: [
      {
        internalType: "euint32",
        name: "encryptedSum",
        type: "bytes32",
      },
      {
        internalType: "euint32",
        name: "encryptedCount",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "sampleId",
        type: "uint256",
      },
    ],
    name: "getSampleSynopsis",
    outputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "string",
        name: "dataCID",
        type: "string",
      },
      {
        internalType: "uint32",
        name: "publicAvgRate",
        type: "uint32",
      },
      {
        internalType: "uint32",
        name: "measurementCount",
        type: "uint32",
      },
      {
        internalType: "uint32",
        name: "minBpm",
        type: "uint32",
      },
      {
        internalType: "uint32",
        name: "maxBpm",
        type: "uint32",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "isPublic",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSamples",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint32",
        name: "publicAvgRate",
        type: "uint32",
      },
      {
        indexed: false,
        internalType: "uint32",
        name: "measurementCount",
        type: "uint32",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "isPublic",
        type: "bool",
      },
    ],
    name: "SampleLogged",
    type: "event",
  },
] as const;

