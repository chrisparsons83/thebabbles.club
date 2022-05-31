import { useEffect, useState } from "react";
import { TwitterTweetEmbed } from "react-twitter-embed";

type Props = {
  twitterId: string;
  showOnInitialLoad: boolean;
};

export default function TwitterEmbed({ twitterId, showOnInitialLoad }: Props) {
  const [show, setShow] = useState(showOnInitialLoad);

  useEffect(() => {
    setShow(showOnInitialLoad);
  }, [showOnInitialLoad]);

  const toggle = () => {
    setShow((prevState) => !prevState);
  };

  if (!show)
    return (
      <button onClick={toggle} className="btn btn-secondary btn-xs">
        Show Tweet
      </button>
    );

  return (
    <div>
      <TwitterTweetEmbed tweetId={twitterId} />
      <button onClick={toggle} className="btn btn-secondary btn-xs">
        Hide Tweet
      </button>
    </div>
  );
}
