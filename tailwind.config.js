const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./app/**/*.{ts,tsx,jsx,js}"],
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
    themes: [
      "corporate",
      {
        thebabbles: {
          primary: "#0761d1",
          secondary: "#2f71e8",
          accent: "#d1342f",
          neutral: "#1a181a",
          "base-100": "#0a0a0a",
          info: "#0092D6",
          success: "#6CB288",
          warning: "#DAAD58",
          error: "#AB3D30",
        },
      },
    ],
  },
};
