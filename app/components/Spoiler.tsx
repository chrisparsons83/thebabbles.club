import clsx from "clsx";
import { useState } from "react";

type Props = {
  children: React.ReactNode;
};

const Spoiler = ({ children }: Props) => {
  const [isHidden, setIsHidden] = useState(true);

  const handleClick = () => {
    setIsHidden((prevState) => !prevState);
  };

  return (
    <span
      className={clsx(
        "px-1",
        isHidden ? "bg-black text-black" : "bg-gray-400 text-black"
      )}
      onClick={handleClick}
    >
      {children}
    </span>
  );
};

export default Spoiler;
