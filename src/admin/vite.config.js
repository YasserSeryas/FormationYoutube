// vite.config.js
export default (config) => {
  // Merge votre configuration avec celle fournie par Strapi
  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      {
        name: 'treat-js-files-as-jsx',
        async transform(code, id) {
          if (!id.match(/node_modules\/strapi-stripe\/.*\.js$/)) return null

          return transformWithEsbuild(code, id, {
            loader: 'jsx',
            jsx: 'automatic',
          })
        },
      }
    ],
    optimizeDeps: {
      ...config.optimizeDeps,
      force: true,
      esbuildOptions: {
        ...(config.optimizeDeps?.esbuildOptions || {}),
        loader: {
          ...(config.optimizeDeps?.esbuildOptions?.loader || {}),
          '.js': 'jsx',
        },
      },
    }
  }
}
