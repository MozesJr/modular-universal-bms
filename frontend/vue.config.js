// vue.config.js
// module.exports = {
//   runtimeCompiler: true,
//   lintOnSave: false,
// };

// local
module.exports = {
  runtimeCompiler: true,
  lintOnSave: false,
  devServer: {
    proxy: {
      "/api": {
        target: "http://localhost:3000", // <-- GANTI port 8000 ini dengan port server backend Anda (Golang/Node)
        changeOrigin: true,
        pathRewrite: { "^/api": "/api" }, // Tetap menyertakan /api saat dikirim ke backend
        logLevel: "debug", // Membantu memunculkan log pengalihan di terminal frontend
      },
    },
  },
};
