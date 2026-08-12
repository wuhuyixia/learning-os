/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  ...(isGithubPages
    ? {
        basePath: "/learning-os",
        assetPrefix: "/learning-os/",
      }
    : {}),
};

export default nextConfig;
