// app/components/Popup.tsx (or src/components/Popup.tsx)
"use client";

import React from "react";

type PopupButton = {
  label: string;
  onClick: () => void;
  color?: "primary" | "danger" | "neutral";
  autoClose?: boolean; // if true, call onClose after onClick
};

type PopupProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: React.ReactNode;
  widthClass?: string; // e.g. "max-w-md w-full"
  heightClass?: string; // optional if you want to constrain height
  buttons?: PopupButton[]; // 0, 1, or 2+ buttons (we usually use 1 or 2)
};

const colorClasses: Record<NonNullable<PopupButton["color"]>, string> = {
  primary: "bg-[#1DCD9F] text-[#000000] hover:bg-[#169976] border-none",
  danger: "bg-red-600 text-white hover:bg-red-500 border-none",
  neutral: "border border-[#169976] text-white hover:bg-[#000000]",
};

export default function Popup({
  open,
  onClose,
  title,
  message,
  widthClass = "max-w-md w-full",
  heightClass,
  buttons = [],
}: PopupProps) {
  if (!open) return null;

  const handleClick = (btn: PopupButton) => {
    try {
      btn.onClick?.();
    } finally {
      if (btn.autoClose !== false) onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-[2px]"
      aria-modal="true"
      role="dialog"
    >
      <div
        className={[
          "bg-[#222222] border border-[#169976] rounded-2xl shadow-xl p-5",
          widthClass,
          heightClass || "",
          "mx-4",
        ].join(" ")}
      >
        {title && (
          <h3 className="text-white text-xl font-semibold mb-3">{title}</h3>
        )}
        <div className="text-white/90 mb-5">{message}</div>

        <div className="flex gap-2 justify-end">
          {buttons.length === 0 ? (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded border border-[#169976] text-white hover:bg-[#000000] transition"
            >
              Close
            </button>
          ) : (
            buttons.map((b, i) => (
              <button
                key={i}
                onClick={() => handleClick(b)}
                className={[
                  "px-4 py-2 rounded transition",
                  colorClasses[b.color || "neutral"],
                ].join(" ")}
              >
                {b.label}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
