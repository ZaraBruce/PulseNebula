/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@fhevm/mock-utils", "@zama-fhe/relayer-sdk"],
  experimental: {
    esmExternals: "loose"
  },
  images: { unoptimized: true },
  trailingSlash: true,
  output: "export",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" }
        ]
      },
      {
        source: "/:path*.wasm",
        headers: [
          { key: "Content-Type", value: "application/wasm" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" }
        ]
      }
    ];
  }
};

export default nextConfig;

