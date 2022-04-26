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

TimeAgo.addLocale(en);

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: tailwindStylesheetUrl }];
};

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "The Babbles",
  viewport: "width=device-width,initial-scale=1",
});

type LoaderData = {
  user: User | null;
};

export const loader: LoaderFunction = async ({ request }) => {
  return json<LoaderData>({
    user: await getUser(request),
  });
};

export default function App() {
  const { user } = useLoaderData<LoaderData>();
  const [socket, setSocket] = useState<Socket>();

  useEffect(() => {
    const socket = io();
    setSocket(socket);
    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("confirmation", (data) => {
      console.log(data);
    });
  }, [socket]);

  return (
    <html lang="en" className="h-full" data-theme="business">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <SocketProvider socket={socket}>
          <Navbar user={user} />
          <div className="prose px-4 md:container md:mx-auto">
            <Outlet />
          </div>
          <DominosModal />
        </SocketProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
