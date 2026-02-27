"use client";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

const Header = () => {
  const pathName = usePathname();
  return (
    <header>
      <div className="main-container inner">
        <Link href="/">
          <Image
            src="logo-2.svg"
            alt="Coinaholic logo"
            width={200}
            height={45}
          />
        </Link>
        <nav>
          <Link
            href="/"
            className={cn("nav-link", {
              "is-active": pathName === "/",
              "is-home": true,
            })}
          >
            Home
          </Link>
          <p>Search Modal</p>
          <Link
            href="/coins"
            className={cn("nav-link", {
              "is-active": pathName === "/",
              "is-home": true,
            })}
          >
            All Coins
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
