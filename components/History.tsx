import React from "react";
import { Post, PostType } from "../types";
import { Type, Image, Film, BookImage } from "lucide-react";

interface HistoryProps {
  posts: Post[];
  onSelectPost: (post: Post) => void;
  onClearHistory?: () => void;
}

const PostTypeIcon = ({ type }: { type: PostType }) => {
  switch (type) {
    case PostType.TEXT:
      return <Type className="h-5 w-5 text-brand-primary" />;
    case PostType.IMAGE:
      return <Image className="h-5 w-5 text-brand-primary" />;
    case PostType.VIDEO:
      return <Film className="h-5 w-5 text-brand-primary" />;
    case PostType.STORY:
      return <BookImage className="h-5 w-5 text-brand-primary" />;
    default:
      return null;
  }
};

export const History: React.FC<HistoryProps> = ({
  posts,
  onSelectPost,
  onClearHistory,
}) => {
  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-2">
        <span className="text-lg font-semibold text-brand-text">History</span>
        {onClearHistory && (
          <button
            className="text-xs px-3 py-1 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors font-semibold"
            onClick={onClearHistory}
            title="Clear History"
          >
            Clear
          </button>
        )}
      </div>
      <div
        className="space-y-3 overflow-y-auto custom-scrollbar"
        style={{ maxHeight: 340, minHeight: 120 }}
      >
        {posts.map((post) => (
          <div
            key={post.id}
            onClick={() => onSelectPost(post)}
            className="flex items-center justify-between p-4 bg-brand-surface border border-brand-border rounded-lg cursor-pointer transition-all duration-300 ease-in-out transform hover:border-brand-primary hover:shadow-lg hover:shadow-brand-primary/10 hover:-translate-y-1"
            aria-label={`View post: ${post.prompt}`}
          >
            <div className="flex items-center space-x-4 min-w-0">
              <PostTypeIcon type={post.type} />
              <p className="text-brand-text truncate font-medium flex-1">
                {post.prompt}
              </p>
            </div>
            <span className="text-xs text-brand-text-secondary whitespace-nowrap ml-4">
              {/* {(() => {
                let dateObj = post.created_at;
                if (typeof dateObj === "string") {
                  dateObj = new Date(dateObj);
                }
                return dateObj instanceof Date && !isNaN(dateObj.getTime())
                  ? dateObj.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";
              })()} */}
              posted at {new Date(post.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}  
            </span>
          </div>
        ))}
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(90deg,#6366f1,#a21caf);
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
};
