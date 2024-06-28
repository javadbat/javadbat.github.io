/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
 
  // Optional: Change the output directory `out` -> `dist`
   distDir: 'dist',
  compiler:{
    styledComponents:true
  },
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.(eot|woff|woff2|ttf)([\?]?.*)$/,
      type: 'asset/resource',
    })

    return config
  },
}

module.exports = nextConfig
