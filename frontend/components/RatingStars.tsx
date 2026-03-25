"use client";

interface Props {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
}

const sizes = { sm: "text-base", md: "text-2xl", lg: "text-3xl" };

export default function RatingStars({ value, onChange, size = "md", readonly = false }: Props) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`${sizes[size]} transition ${readonly ? "cursor-default" : "hover:scale-110 cursor-pointer"}`}
        >
          <span className={star <= value ? "text-yellow-400" : "text-gray-300"}>★</span>
        </button>
      ))}
    </div>
  );
}
