"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { FeedbackWidget } from "../components/FeedbackWidget";
import { FeedbackOverlayLayer } from "../components/FeedbackOverlayLayer";
import { FeedbackOverlayPins } from "../components/FeedbackOverlayPins";
import { FeedbackProvider } from "../context/FeedbackContext";
import { ScrollContainerProvider } from "../context/ScrollContainerContext";

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
    <FeedbackProvider>
      <ScrollContainerProvider scrollContainerRef={scrollRef}>
        <div className="main-layout-bg flex min-h-screen dark:bg-zinc-950">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <div
              className="shrink-0 overflow-hidden transition-[height] duration-200 ease-out"
              style={{ height: headerVisible ? "5rem" : "0" }}
            >
              <Header />
            </div>
            <div
              ref={scrollRef}
              className="min-w-0 flex-1 overflow-auto"
            >
              <div className="relative min-h-full">
                <main className="min-h-full pt-[80px] px-6 pb-6 dark:bg-zinc-900/80">
                  {children}
                </main>
                <FeedbackOverlayPins />
              </div>
            </div>
          </div>
          <FeedbackWidget />
          <FeedbackOverlayLayer />
        </div>
      </ScrollContainerProvider>
    </FeedbackProvider>
  );
}
