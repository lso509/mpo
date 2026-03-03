"use client";

import "./NeuesProduktButton.css";

const starFill = "#8b5cf6";

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={starFill} aria-hidden>
      <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7.4-6.1-4.6-6.1 4.6 2.3-7.4-6-4.6h7.6z" />
    </svg>
  );
}

export function NeuesProduktButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="neues-produkt-btn inline-flex h-10 items-center justify-center gap-2"
    >
      <StarIcon className="star-1" />
      <StarIcon className="star-2" />
      <StarIcon className="star-3" />
      <StarIcon className="star-4" />
      <StarIcon className="star-5" />
      <StarIcon className="star-6" />
      <span className="relative z-[1]">+ Neues Produkt</span>
    </button>
  );
}
