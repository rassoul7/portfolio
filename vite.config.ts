import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Site utilisateur GitHub Pages (rassoul7.github.io) : servi à la racine.
export default defineConfig({ plugins: [react()], base: "/" });
