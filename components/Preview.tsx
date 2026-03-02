import React from "react";
import ReactMarkdown from "react-markdown";
import { Post } from "../types";
import { Download, Copy, Share2, Twitter } from "lucide-react";

interface PreviewProps {
  post: Post;
  onUsePrompt?: (prompt: string, imageUrl: string) => void;
}

export const Preview: React.FC<PreviewProps> = ({ post, onUsePrompt }) => {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handleShare = async (text: string) => {
    try {
      const response = await fetch("/api/share/twitter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        alert("Posted to X successfully!");
      } else {
        alert("Failed to post to X.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to post to X.");
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderContent = () => {
    switch (post.type) {
      case "text":
        return (
          <div className="text-brand-text-secondary whitespace-pre-wrap p-4 bg-brand-bg rounded-lg border border-brand-border prose max-w-none">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        );
      case "image":
        return (
          <div className="relative">
            <img
              src={post.content}
              alt={post.prompt}
              className="rounded-lg w-full object-contain"
            />
            {onUsePrompt && (
              <button
                onClick={() => onUsePrompt(post.prompt, post.content)}
                className="absolute bottom-4 right-4 px-4 py-2 text-sm bg-brand-primary hover:bg-brand-secondary text-white font-semibold rounded-lg shadow-lg transition z-10"
                style={{ opacity: 0.95 }}
              >
                Use this image
              </button>
            )}
          </div>
        );
      case "video":
        return (
          <video src={post.content} controls className="rounded-lg w-full" />
        );
      case "story":
        return (
          <div className="space-y-4">
            <video src={post.content} controls className="rounded-lg w-full" />
            <div className="p-4 bg-brand-bg rounded-lg border border-brand-border">
              <h3 className="text-lg font-bold text-brand-text mb-2">
                Generated Story
              </h3>
              <div className="text-brand-text-secondary whitespace-pre-wrap prose max-w-none">
                <ReactMarkdown>{post.storyText || ""}</ReactMarkdown>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderActions = () => {
    switch (post.type) {
      case "text":
        return (
          <button
            onClick={() => handleCopy(post.content)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-brand-surface hover:bg-brand-border border border-brand-border text-brand-text font-semibold rounded-lg transition"
          >
            <Copy size={16} /> Copy
          </button>
        );
      case "image":
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                handleDownload(post.content, `postai-image-${post.id}.png`)
              }
              className="flex items-center gap-2 px-4 py-2 text-sm bg-brand-surface hover:bg-brand-border border border-brand-border text-brand-text font-semibold rounded-lg transition"
            >
              <Download size={16} /> Download
            </button>
          </div>
        );
      case "video":
        return (
          <button
            onClick={() =>
              handleDownload(post.content, `postai-video-${post.id}.mp4`)
            }
            className="flex items-center gap-2 px-4 py-2 text-sm bg-brand-surface hover:bg-brand-border border border-brand-border text-brand-text font-semibold rounded-lg transition"
          >
            <Download size={16} /> Download
          </button>
        );
      case "story":
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                handleDownload(post.content, `postai-story-${post.id}.mp4`)
              }
              className="flex items-center gap-2 px-4 py-2 text-sm bg-brand-surface hover:bg-brand-border border border-brand-border text-brand-text font-semibold rounded-lg transition"
            >
              <Download size={16} /> Download Video
            </button>
            <button
              onClick={() => handleCopy(post.storyText || "")}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-brand-surface hover:bg-brand-border border border-brand-border text-brand-text font-semibold rounded-lg transition"
            >
              <Copy size={16} /> Copy Story
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-brand-surface rounded-xl border border-brand-border shadow-lg shadow-black/20 p-6 space-y-4 transition-all duration-300 ease-in-out hover:shadow-brand-primary/10 hover:border-brand-primary/50">
      <div className="relative">{renderContent()}</div>
      <div className="flex items-center justify-between pt-4 border-t border-brand-border">
        <p className="text-xs text-brand-text-secondary italic truncate pr-4">
          Prompt: &quot;{post.prompt}&quot;
        </p>
        <div className="flex items-center gap-2">{renderActions()}</div>
      </div>
    </div>
  );
};
