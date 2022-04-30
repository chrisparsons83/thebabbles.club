import { createContext, useContext, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { User } from "./models/user.server";

enum Theme {
  DARK = "dark",
  LIGHT = "light",
}

type BabblesContextType = {
  theme: Theme | null;
  setTheme: Dispatch<SetStateAction<Theme | null>>;
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
};

const BabblesContext = createContext<BabblesContextType | undefined>(undefined);

function BabblesProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme | null>(Theme.DARK);
  const [user, setUser] = useState<User | null>(null);

  return (
    <BabblesContext.Provider value={{ theme, setTheme, user, setUser }}>
      {children}
    </BabblesContext.Provider>
  );
}

function useBabblesContext() {
  const context = useContext(BabblesContext);
  if (context === undefined) {
    throw new Error("useBabblesContext must be used within a BabblesProvider");
  }
  return context;
}

export { Theme, BabblesProvider, useBabblesContext };
