// Expo's default Babel preset. Explicit here so jest-expo's transform can resolve it;
// it's the same preset Metro already applies, so app builds are unaffected.
module.exports = function (api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};
