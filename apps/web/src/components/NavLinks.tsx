'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import useClickSound from "./useClickSound";

const links = [
  { href: "/new-character", label: "New Character" },
  { href: "/quests", label: "Quests" },
  { href: "/", label: "About" },
];

export default function NavLinks() {
  const pathname = usePathname();
  const playClick = useClickSound();

  return (
    <nav className="mt-1 flex flex-wrap gap-4 text-lg font-semibold leading-tight">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`transition-colors hover:text-primary ${active ? 'text-primary' : 'text-base-content'}`}
            onClick={() => playClick()}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
