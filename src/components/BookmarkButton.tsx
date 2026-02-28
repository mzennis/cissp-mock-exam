"use client";

interface BookmarkButtonProps {
  isBookmarked: boolean;
  onClick: () => void;
}

export function BookmarkButton({ isBookmarked, onClick }: BookmarkButtonProps) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
      title={isBookmarked ? "Remove bookmark" : "Bookmark this question"}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={isBookmarked ? "#6AB1C2" : "none"}
        stroke={isBookmarked ? "#6AB1C2" : "#6A8A9A"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}
