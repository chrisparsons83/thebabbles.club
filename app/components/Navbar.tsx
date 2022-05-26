import { Link } from "@remix-run/react";
import type { User } from "~/models/user.server";

type Props = {
  user: User | null;
};

export default function Navbar({ user }: Props) {
  return (
    <div className="mb-4 bg-primary py-2">
      <div className="flex items-center px-4 md:container md:mx-auto">
        <div className="text-bold grow text-3xl">
          <Link to="/">The Babbles</Link>
        </div>
        <div className="flex-none">
          {user && (
            <label
              htmlFor="my-drawer"
              className="btn btn-secondary drawer-button"
            >
              Menu
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
