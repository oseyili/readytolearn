/** @type {import('next').NextConfig} */
const nextConfig = {
  // Avoid Windows symlink EPERM by not emitting standalone output on win32.
  // On Render/Linux, standalone is enabled automatically.
  ...(process.platform !== "win32" ? { output: "standalone" } : {}),
};

module.exports = nextConfig;
