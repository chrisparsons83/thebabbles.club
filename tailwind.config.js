const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./app/**/*.{ts,tsx,jsx,js}"],
  darkMode: "class",
  theme: {
    container: {
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Open Sans", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [
    require("daisyui"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
  daisyui: {
    darkTheme: "thebabblesdark",
    lightTheme: "thebabbleslight",
    themes: [
      {
        thebabblesdark: {
          primary: "#131f2e",
          secondary: "#2b333f",
          accent: "#ff7486",
          neutral: "#000509",
          "base-100": "#001221",
          info: "#0092D6",
          success: "#6CB288",
          warning: "#DAAD58",
          error: "#AB3D30",
        },
      },
      {
        thebabbleslight: {
          primary: "#00205B",
          secondary: "#94c6ff",
          accent: "#fcc7dd",
          neutral: "#100e11",
          "base-100": "#FAFAFA",
          info: "#87D4ED",
          success: "#1A7F53",
          warning: "#D28304",
          error: "#E4391B",
        },
      },
    ],
  },
};
