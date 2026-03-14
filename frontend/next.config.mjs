import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Ensure Turbopack uses the frontend folder as the root
    root: __dirname,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
