/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export -> generates apps/web/out for Render Static Site
  output: "export",

  // Optional but commonly needed for static hosting (uncomment if you use <Image />)
  // images: { unoptimized: true },
};

module.exports = nextConfig;
