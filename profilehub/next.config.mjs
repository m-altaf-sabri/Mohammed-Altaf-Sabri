/** @type {import('next').NextConfig} */
import path from "path";



const nextConfig = {
turbopack:{ root: path.resolve(".")},

  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
