/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Stub optional peer-deps that WalletConnect / pino pull in but are not needed
    // client-side (pino-pretty is a dev logger pretty-printer, not needed in browser)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'pino-pretty': false,
        encoding: false,
        'lokijs': false,
      };
    }

    // Suppress the "Critical dependency: expression in require()" warning
    // coming from ox/viem's internal tempo module (dynamic require used only in Node.js)
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /node_modules\/ox\/_esm\/tempo/ },
      { module: /node_modules\/viem\/_esm\/tempo/ },
    ];

    return config;
  },
};

export default nextConfig;
