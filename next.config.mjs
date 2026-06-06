/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // unsafe-eval needed by @solana/web3.js
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https: wss:",  // wallet RPC + websocket connections
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; "),
  },
];

const nextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
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
