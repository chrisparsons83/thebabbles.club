import { User } from "@prisma/client";
import { Form, Link } from "@remix-run/react";

type Props = {
  user: User | null;
};

export default function Navbar({ user }: Props) {
  const showLogout = user !== null;

  return (
    <div className="mb-4 bg-primary py-2">
      <div className="flex px-4 md:container md:mx-auto">
        <div className="text-bold grow text-2xl">
          <Link to="/">The Babbles</Link>
        </div>
        <div className="flex-none">
          {showLogout && (
            <Form action="/logout" method="post">
              <button type="submit" className="btn btn-secondary rounded px-2">
                Logout
              </button>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}
