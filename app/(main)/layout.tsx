"use client";

import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-auto bg-zinc-100 p-6">{children}</main>
      </div>
    </div>
  );
}
