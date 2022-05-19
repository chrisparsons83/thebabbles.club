import { Theme, useTheme } from "~/themeContext";

export default function IndexRoute() {
  const [theme, setTheme] = useTheme();

  const toggleTheme = () => {
    setTheme((prevTheme) =>
      prevTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT
    );
  };

  const message =
    theme === Theme.DARK ? "Turn on Caucasian Mode" : "Turn on Dark Mode";

  return <button onClick={toggleTheme}>{message}</button>;
}
