/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        base: {
          900: "#0e0e10",
          800: "#13131a",
          700: "#16161a",
          600: "#1e1e24",
          500: "#26262e",
        },
        purple: {
          dim: "rgba(127,119,221,0.12)",
          border: "rgba(127,119,221,0.25)",
          muted: "#7F77DD",
          DEFAULT: "#a09af0",
        },
        green: {
          DEFAULT: "#5DCAA5",
        },
        red: {
          DEFAULT: "#f07070",
        },
        amber: {
          DEFAULT: "#EF9F27",
        },
      },
    },
  },
  plugins: [],
};
