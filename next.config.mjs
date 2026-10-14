/** @type {import('next').NextConfig} */
const nextConfig = {
  // `jose` (used by src/server/firebase) is published only as ES modules.
  // Listing it here also tells next/jest to compile it so Jest can load it.
  transpilePackages: ['jose'],
};

export default nextConfig;

import('@opennextjs/cloudflare').then((m) => m.initOpenNextCloudflareForDev());
