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

  return (
    <div>
      <img src={image} alt="preview" className="my-0 max-w-fit" />
      <button onClick={toggle} className="btn btn-secondary btn-xs">
        Hide Preview
      </button>
    </div>
  );
}
