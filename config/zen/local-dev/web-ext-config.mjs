// Read by web-ext when run from this folder: `npx web-ext lint` / `npx web-ext sign`.
export default {
  artifactsDir: "../dist",
  ignoreFiles: ["web-ext-config.mjs"],
  sign: { channel: "unlisted" },
};
