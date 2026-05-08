"use client";

import { useEffect, useRef, useState } from "react";
import { useGlobalSearch } from "../hooks/useGlobalSearch";
import { fetcher } from "@/lib/coingecko.actions";
import { useRouter } from "next/navigation";

const DEBOUNCE = 300;

const GlobalSearch = () => {
  const { open, setOpen } = useGlobalSearch();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchCoin[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // focus input
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // debounce search
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await fetcher<{ coins: SearchCoin[] }>(
          "/search",
          { query },
          0,
        );

        setResults(res.coins || []);
      } catch (err) {
        console.error("Search failed", err);
      }
    }, DEBOUNCE);

    return () => clearTimeout(timeout);
  }, [query]);

  // keyboard nav
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, results.length - 1),
        );
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      }

      if (e.key === "Enter") {
        const selected = results[selectedIndex];
        if (selected) {
          router.push(`/coins/${selected.id}`);
          setOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, results, selectedIndex, router, setOpen]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-40"
      onClick={() => setOpen(false)} // 🔥 click outside closes
    >
      <div
        className="w-full max-w-xl bg-zinc-900 rounded-xl shadow-xl border border-zinc-800 relative"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        {/* 🔥 CLOSE BUTTON */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 text-zinc-400 hover:text-white text-xl"
        >
          ✕
        </button>

        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          placeholder="Search coins..."
          className="w-full p-4 bg-transparent outline-none text-white border-b border-zinc-800"
        />

        <ul className="max-h-80 overflow-y-auto">
          {results.map((coin, index) => (
            <li
              key={coin.id}
              onClick={() => {
                router.push(`/coins/${coin.id}`);
                setOpen(false);
              }}
              className={`p-4 cursor-pointer flex items-center gap-3 ${
                index === selectedIndex
                  ? "bg-zinc-800"
                  : "hover:bg-zinc-800/50"
              }`}
            >
              <img src={coin.thumb} alt={coin.name} className="w-6 h-6" />
              <span className="text-white">
                {coin.name} ({coin.symbol.toUpperCase()})
              </span>
            </li>
          ))}

          {!results.length && query && (
            <li className="p-4 text-zinc-400">No results</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default GlobalSearch;