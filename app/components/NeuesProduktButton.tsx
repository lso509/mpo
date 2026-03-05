"use client";

export function NeuesProduktButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#FF6554] px-4 py-2 text-sm font-medium text-white hover:bg-[#e55a4a]"
    >
      <span>+ Neues Produkt</span>
    </button>
  );
}
