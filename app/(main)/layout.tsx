"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  const scrollThreshold = 12;

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const y = el.scrollTop;
    const delta = y - lastScrollY.current;
    if (y <= 0) {
      setHeaderVisible(true);
    } else if (delta > scrollThreshold) {
      setHeaderVisible(false);
    } else if (delta < -scrollThreshold) {
      setHeaderVisible(true);
    }
    lastScrollY.current = y;
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    lastScrollY.current = el.scrollTop;
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div
          className="shrink-0 overflow-hidden transition-[height] duration-200 ease-out"
          style={{ height: headerVisible ? "3rem" : "0" }}
        >
          <Header />
        </div>
        <div
          ref={scrollRef}
          className="min-w-0 flex-1 overflow-auto"
        >
          <main className="bg-zinc-100 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
