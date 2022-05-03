import { Form, Link } from "@remix-run/react";
import React, { useRef } from "react";
import type { User } from "~/models/user.server";

type Props = {
  user: User | null;
  children: React.ReactNode;
};

export default function Drawer({ user, children }: Props) {
  const drawerCheckboxRef = useRef<HTMLInputElement>(null);

  if (!user) return <div>{children}</div>;

  const toggleDrawer = () => {
    if (!drawerCheckboxRef.current) return;
    drawerCheckboxRef.current.checked = !drawerCheckboxRef.current.checked;
  };

  return (
    <div className="drawer">
      <input
        id="my-drawer"
        type="checkbox"
        className="drawer-toggle"
        ref={drawerCheckboxRef}
      />
      <div className="drawer-content pb-4">{children}</div>
      <div className="drawer-side">
        <label htmlFor="my-drawer" className="drawer-overlay"></label>
        <ul className="menu w-80 overflow-y-auto bg-base-100 p-4 text-base-content">
          <li>
            <Link to="/" onClick={toggleDrawer}>
              Home
            </Link>
          </li>
          {user.isActive && (
            <li>
              <Link to="/users" onClick={toggleDrawer}>
                Users
              </Link>
            </li>
          )}
          {user.isActive && (
            <li>
              <Link to="/posts/new" onClick={toggleDrawer}>
                Create New Post
              </Link>
            </li>
          )}
          <li>
            <Form action="/logout" method="post">
              <button
                type="submit"
                onClick={toggleDrawer}
                className="w-full text-left"
              >
                Logout
              </button>
            </Form>
          </li>
        </ul>
      </div>
    </div>
  );
}
