"use client";

import { createContext, useContext, type RefObject } from "react";

const ScrollContainerContext = createContext<RefObject<HTMLDivElement | null> | null>(null);

export function ScrollContainerProvider({
  scrollContainerRef,
  children,
}: {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) {
  return (
    <ScrollContainerContext.Provider value={scrollContainerRef}>
      {children}
    </ScrollContainerContext.Provider>
  );
}

export function useScrollContainer(): RefObject<HTMLDivElement | null> | null {
  return useContext(ScrollContainerContext);
}
