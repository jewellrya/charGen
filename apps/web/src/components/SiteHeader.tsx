'use client';

import MusicToggle from "./MusicToggle";
import NavLinks from "./NavLinks";

interface Props {
  className?: string;
}

export default function SiteHeader({ className = "" }: Props) {
  const base = "border-b border-base-300 pt-8 pb-4 mb-4 md:pt-12 md:pb-6 md:mb-6";
  return (
    <header className={`${base} ${className}`}>
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-semibold leading-tight">
          The Trials of Nral
        </h1>
        <div className="flex flex-wrap items-center gap-4 ms-auto">
          <NavLinks />
          <MusicToggle />
        </div>
      </div>
    </header>
  );
}
