// Demo: l'app vera con un Supabase finto in memoria (supabase-finto.js). Serve per provare la UI senza toccare i dati.
//   npm run demo      → http://localhost:5174
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const radice = fileURLToPath(new URL("../..", import.meta.url));
const finto = fileURLToPath(new URL("./supabase-finto.js", import.meta.url));

export default defineConfig({
  root: radice,
  envDir: fileURLToPath(new URL(".", import.meta.url)),   // niente .env.local: la demo non deve vedere le chiavi vere
  cacheDir: "node_modules/.vite-demo",                    // così può girare insieme a npm run dev
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify("https://demo.invalid"),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify("demo"),
    "import.meta.env.VITE_VERSIONE": JSON.stringify("demo"),
  },
  server: { port: 5174, strictPort: true },
  plugins: [
    {
      name: "supabase-finto",
      enforce: "pre",
      // src/supabase.js (il client vero) diventa il finto, per chiunque lo importi
      resolveId(sorgente, importatore) {
        if (importatore && importatore !== finto && /(^|\/)supabase\.js$/.test(sorgente) && !importatore.includes("node_modules")) return finto;
      },
    },
    {
      name: "etichetta-demo",
      transformIndexHtml: (html) =>
        html
          .replace("<title>Cola</title>", "<title>Cola · demo</title>")
          .replace(
            "<body>",
            '<body><div style="position:fixed;z-index:60;top:calc(env(safe-area-inset-top) + 6px);left:50%;transform:translateX(-50%);' +
              'padding:3px 10px;border-radius:999px;background:#2e4a2b;color:#fff;font:600 12px/1.4 system-ui;pointer-events:none">Demo · dati finti</div>',
          ),
    },
  ],
});
