export default {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // keep viewBox so scaling works
          removeViewBox: false,
          // disable IDs cleanup (it's already handled differently in v4)
          cleanupIds: false,
        },
      },
    },
    // remove width/height so SVG scales with viewBox
    'removeDimensions',
  ],
};
