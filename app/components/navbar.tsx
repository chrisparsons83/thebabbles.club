import { User } from "@prisma/client";
import { Form, Link } from "@remix-run/react";

type Props = {
  user: User | null;
};

export default function Navbar({ user }: Props) {
  const showLogout = user !== null;

  return (
    <div className="flex">
      <div className="grow">
        <Link to="/">The Babbles</Link>
      </div>
      <div className="flex-none">
        {showLogout && (
          <Form action="/logout" method="post">
            <button
              type="submit"
              className="rounded bg-slate-600 py-2 px-4 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
            >
              Logout
            </button>
          </Form>
        )}
      </div>
    </div>
  );
}
