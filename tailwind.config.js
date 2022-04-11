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
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      "light",
      "dark",
      "cupcake",
      "bumblebee",
      "emerald",
      "corporate",
      "synthwave",
      "retro",
      "halloween",
      "forest",
      "pastel",
      "fantasy",
      "luxury",
      "dracula",
      "autumn",
      "business",
      "lemonade",
      "night",
      "winter",
    ],
  },
};
