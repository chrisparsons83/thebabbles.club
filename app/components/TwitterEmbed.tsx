import { useEffect, useState } from "react";
import { TwitterTweetEmbed } from "react-twitter-embed";
import { Theme, useTheme } from "~/themeContext";

type Props = {
  twitterId: string;
  showOnInitialLoad: boolean;
};

export default function TwitterEmbed({ twitterId, showOnInitialLoad }: Props) {
  const [show, setShow] = useState(showOnInitialLoad);
  const [theme] = useTheme();

  useEffect(() => {
    setShow(showOnInitialLoad);
  }, [showOnInitialLoad]);

  const toggle = () => {
    setShow((prevState) => !prevState);
  };

  const options = {
    theme: !theme || theme === Theme.DARK ? "dark" : "light",
  };

  if (!show)
    return (
      <button onClick={toggle} className="btn btn-secondary btn-xs">
        Show Tweet
      </button>
    );

  return (
    <div>
      <TwitterTweetEmbed tweetId={twitterId} options={options} />
      <button onClick={toggle} className="btn btn-secondary btn-xs">
        Hide Tweet
      </button>
    </div>
  );
}
