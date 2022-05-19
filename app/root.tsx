import type {
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";

import type { User } from "@prisma/client";
import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";

import tailwindStylesheetUrl from "./styles/tailwind.css";
import { getUser } from "./session.server";
import Navbar from "./components/Navbar";
import { SocketProvider } from "./context";
import DominosModal from "./components/DominosModal";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en.json";
import { BabblesProvider, useBabblesContext } from "./babblesContext";
import {
  NonFlashOfWrongThemeEls,
  Theme,
  ThemeProvider,
  useTheme,
} from "./themeContext";
import Drawer from "./components/Drawer";
import clsx from "clsx";
import { getThemeSession } from "./theme.server";

TimeAgo.addLocale(en);

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: tailwindStylesheetUrl },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap",
    },
  ];
};

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "The Babbles",
  viewport: "width=device-width,initial-scale=1",
});

type LoaderData = {
  user: User | null;
  theme: Theme | null;
};

export const loader: LoaderFunction = async ({ request }) => {
  const themeSession = await getThemeSession(request);

  const data: LoaderData = {
    theme: themeSession.getTheme(),
    user: await getUser(request),
  };

  return data;
};

export function App() {
  const data = useLoaderData<LoaderData>();
  const [socket, setSocket] = useState<Socket>();
  const { setUser } = useBabblesContext();
  const [theme] = useTheme();

  useEffect(() => {
    const socket = io();
    setSocket(socket);
    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    setUser(data.user);
  }, [data.user, setUser]);

  useEffect(() => {
    if (!socket) return;
    socket.on("confirmation", (data) => {
      console.log(data);
    });
  }, [socket]);

  return (
    <html
      lang="en"
      data-theme={theme === Theme.DARK ? "thebabblesdark" : "thebabbleslight"}
      className={clsx("h-full", theme)}
    >
      <head>
        <Meta />
        <Links />
        <NonFlashOfWrongThemeEls ssrTheme={Boolean(data.theme)} />
      </head>
      <body className="h-full">
        <Drawer user={data.user}>
          <SocketProvider socket={socket}>
            <Navbar user={data.user} />
            <div className="prose px-4 dark:prose-invert md:container md:mx-auto">
              <Outlet />
            </div>
            <DominosModal />
          </SocketProvider>
        </Drawer>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export default function AppWithProvider() {
  const data = useLoaderData<LoaderData>();

  return (
    <BabblesProvider>
      <ThemeProvider specifiedTheme={data.theme}>
        <App />
      </ThemeProvider>
    </BabblesProvider>
  );
}
