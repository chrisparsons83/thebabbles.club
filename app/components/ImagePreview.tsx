import { useState } from "react";

type Props = {
  image: string;
};

export default function ImagePreview({ image }: Props) {
  const [show, setShow] = useState(true);

  const toggle = () => {
    setShow((prevState) => !prevState);
  };

  if (!show)
    return (
      <button onClick={toggle} className="btn btn-secondary btn-xs">
        Show Preview
      </button>
    );

  const gifvRegex = /gifv$/;
  if (gifvRegex.test(image))
    return (
      <div>
        <video
          preload="auto"
          autoPlay={true}
          loop={true}
          className="my-0 max-w-full"
        >
          <source src={image.replace(gifvRegex, "mp4")} type="video/mp4" />
        </video>
        <button onClick={toggle} className="btn btn-secondary btn-xs">
          Hide Preview
        </button>
      </div>
    );

  const webmRegex = /webm$/;
  if (webmRegex.test(image))
    return (
      <div>
        <video
          preload="auto"
          autoPlay={true}
          loop={true}
          className="my-0 max-w-full"
        >
          <source src={image} type="video/mp4" />
        </video>
        <button onClick={toggle} className="btn btn-secondary btn-xs">
          Hide Preview
        </button>
      </div>
    );

  return (
    <div>
      <img src={image} alt="preview" className="my-0 max-w-full" />
      <button onClick={toggle} className="btn btn-secondary btn-xs">
        Hide Preview
      </button>
    </div>
  );
}
