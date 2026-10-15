"use client";

interface BookmarkButtonProps {
  isBookmarked: boolean;
  onClick: () => void;
}

export function BookmarkButton({ isBookmarked, onClick }: BookmarkButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg transition-colors cursor-pointer ${
        isBookmarked
          ? "text-cissp-teal bg-cissp-teal/10 hover:bg-cissp-teal/20"
          : "text-cissp-text-muted hover:text-cissp-text hover:bg-white/10"
      }`}
      title={isBookmarked ? "Remove bookmark" : "Bookmark this question"}
      aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this question"}
      aria-pressed={isBookmarked}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={isBookmarked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}
