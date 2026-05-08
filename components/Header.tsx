"use client";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";

const Header = () => {
  const pathName = usePathname();
   const { setOpen } = useGlobalSearch();
  return (
    <header>
      <div className="main-container inner">
        <Link href="/">
          <Image
            src="/logo-2.svg"
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
           <button
            onClick={() => setOpen(true)}
            className="nav-link cursor-pointer"
          >
            Search Modal
          </button>
          <Link
            href="/coins"
            className={cn("nav-link", {
              "is-active": pathName === "/coins",
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
