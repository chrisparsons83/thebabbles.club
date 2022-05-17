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
      "pastel",
      "garden",
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
    ],
  },
};
