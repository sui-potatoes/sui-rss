import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import Markdown from "vite-plugin-react-markdown";

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        proxy: {
            "/rss.xml": "http://localhost:5173/api/rss", // or your dev server path
        },
    },
    plugins: [tailwindcss(), react()],
});
