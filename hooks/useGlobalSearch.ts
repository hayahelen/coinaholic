"use client";

import { useEffect, useState } from "react";

let globalOpen = false;
let listeners: ((open: boolean) => void)[] = [];

export const useGlobalSearch = () => {
  const [open, setOpenState] = useState(globalOpen);

  const setOpen = (value: boolean | ((prev: boolean) => boolean)) => {
    globalOpen =
      typeof value === "function" ? value(globalOpen) : value;

    listeners.forEach((l) => l(globalOpen));
  };

  useEffect(() => {
    const listener = (value: boolean) => setOpenState(value);
    listeners.push(listener);

    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");

      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }

      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { open, setOpen };
};