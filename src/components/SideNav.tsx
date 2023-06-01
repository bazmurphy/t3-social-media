import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { IconHoverEffect } from "./IconHoverEffect";
import { VscHome, VscAccount, VscSignIn, VscSignOut } from "react-icons/vsc";

export function SideNav() {
  // get the session from next auth
  const session = useSession();
  // get the user from the session
  // if we are logged in there will be a user
  // if not there will not no user
  const user = session.data?.user;

  return (
    <nav className="sticky top-0 px-2 py-4">
      <ul className="flex flex-col items-start gap-2 whitespace-nowrap">
        <li>
          <Link href="/">
            <IconHoverEffect>
              <span className="flex items-center gap-4">
                <VscHome className="h-8 w-8" />
                {/* only show an Icon on the smaller screensizes using hidden and then md:inline */}
                <span className="hidden text-lg md:inline">Home</span>
              </span>
            </IconHoverEffect>
          </Link>
        </li>
        {/* if the user exists then we render the profile link */}
        {user != null && (
          <li>
            <Link href={`/profiles/${user.id}`}>
              <IconHoverEffect>
                <span className="flex items-center gap-4">
                  <VscAccount className="h-8 w-8" />
                  {/* only show an Icon on the smaller screensizes using hidden and then md:inline */}
                  <span className="hidden text-lg md:inline">Profile</span>
                </span>
              </IconHoverEffect>
            </Link>
          </li>
        )}
        {/* handling for Login / Logout Links */}
        {user == null ? (
          <li>
            {/* onClick run the next auth signOut method, also void is for TypeScript to say we don't care about the return */}
            <button onClick={() => void signIn()}>
              <IconHoverEffect>
                <span className="flex items-center gap-4">
                  <VscSignIn className="h-8 w-8 fill-green-700" />
                  {/* only show an Icon on the smaller screensizes using hidden and then md:inline */}
                  <span className="hidden text-lg text-green-700 md:inline">
                    Log In
                  </span>
                </span>
              </IconHoverEffect>
            </button>
          </li>
        ) : (
          <li>
            <button onClick={() => void signOut()}>
              {" "}
              <IconHoverEffect>
                <span className="flex items-center gap-4">
                  <VscSignOut className="h-8 w-8 fill-red-700" />
                  {/* only show an Icon on the smaller screensizes using hidden and then md:inline */}
                  <span className="hidden text-lg text-red-700 md:inline">
                    Log Out
                  </span>
                </span>
              </IconHoverEffect>
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}
