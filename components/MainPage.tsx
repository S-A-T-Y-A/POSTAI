import React, { useRef } from "react";
import { PostCreator } from "./PostCreator";
import { Preview } from "./Preview";
import { History } from "./History";
import { Loader } from "./Loader";
import { HowItWorks } from "./HowItWorks";
import { useUser } from "../src/contexts/UserContext";
import { Post, PostType,SubscriptionPlan } from "../types";
import { CREDIT_COSTS } from "../src/constants";
import { Companion } from "./Companion";

interface MainPageProps {
  posts: Post[];
  currentPost: Post | null;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  isApiKeySelected: boolean | null;
  handleGenerate: (
    prompt: string,
    type: PostType,
    images: string[] | null,
  ) => void;
  handleSelectPost: (post: Post) => void;
  credits: number;
}
export const MainPage: React.FC<MainPageProps> = ({
  posts,
  currentPost,
  isLoading,
  loadingMessage,
  error,
  isApiKeySelected,
  handleGenerate,
  handleSelectPost,
  credits,
}) => {
  const userContext = useUser();
  const { user } = userContext;
  // Clear history handler
  const [historyPosts, setHistoryPosts] = React.useState(posts);
  React.useEffect(() => {
    setHistoryPosts(posts);
  }, [posts]);
  const handleClearHistory = () => {
    setHistoryPosts([]);
    localStorage.removeItem("postai_posts");
    // Debug user object and request
    console.log("handleClearHistory user:", user);
    if (user?.id) {
      console.log("Sending DELETE /api/posts with x-user-id:", user.id);
      fetch("/api/posts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("DELETE /api/posts response:", data);
        });
    } else {
      console.warn("No user.id found, not sending DELETE request");
    }
  };
  const postCreatorRef = useRef<any>(null);

  // Gather prompt history from posts
  const promptHistory = posts.map((post) => post.prompt).filter(Boolean);

  const { accessToken } = useUser();
  const handleUsePrompt = async (prompt: string, imageUrl: string) => {
    let finalImage = imageUrl;
    // If imageUrl is a Drive URL, fetch as blob and convert to base64
    if (imageUrl.startsWith("https://drive.google.com/uc") && accessToken) {
      const fileIdMatch = imageUrl.match(/id=([a-zA-Z0-9_-]+)/);
      const fileId = fileIdMatch ? fileIdMatch[1] : null;
      if (fileId) {
        try {
          const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (res.ok) {
            const blob = await res.blob();
            const reader = new FileReader();
            finalImage = await new Promise<string>((resolve) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
          }
        } catch (e) {
          // fallback to original imageUrl
        }
      }
    }
    if (
      postCreatorRef.current &&
      typeof postCreatorRef.current.setPromptAndImage === "function"
    ) {
      postCreatorRef.current.setPromptAndImage(prompt, finalImage);
    }
  };

  // New: handle suggestion click to set prompt only
  const handleSuggestionClick = (suggestion: string) => {
    if (
      postCreatorRef.current &&
      typeof postCreatorRef.current.setPromptAndImage === "function"
    ) {
      postCreatorRef.current.setPromptAndImage(suggestion, "");
    }
  };

  return (
    <main className="container mx-auto p-4 md:p-8 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="lg:col-span-1 space-y-8">
          {error && (
            <div
              className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg relative animate-fade-in"
              role="alert"
            >
              <strong className="font-bold">Oops! </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <div className="flex justify-between items-center bg-brand-surface rounded-xl border border-brand-border shadow-2xl p-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-brand-text">
              Create Content
            </h2>
            <div className="text-right">
              <p className="text-lg font-semibold text-brand-primary">
                Credits
              </p>
              <p className="text-sm text-brand-text-secondary">
                {credits} remaining
              </p>
            </div>
          </div>
          <div className="bg-brand-surface rounded-xl border border-brand-border shadow-2xl p-6 animate-fade-in">
            <PostCreator
              ref={postCreatorRef}
              onGenerate={handleGenerate}
              isLoading={isLoading}
              isApiKeySelectedForVideo={isApiKeySelected}
              creditCosts={CREDIT_COSTS}
            />
          </div>
          {historyPosts.length > 0 && (
            <div className="mt-12 animate-fade-in">
              <History
                posts={historyPosts}
                onSelectPost={handleSelectPost}
                onClearHistory={handleClearHistory}
                currentPlan={user?.plan as SubscriptionPlan || SubscriptionPlan.FREE}
              />
            </div>
          )}
        </div>
        <div className="lg:col-span-1 lg:sticky top-8 overflow-y-auto pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-[500px] bg-brand-surface rounded-xl border border-brand-border animate-fade-in">
              <Loader message={loadingMessage} />
            </div>
          ) : currentPost ? (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold mb-4 text-brand-text">
                Preview
              </h2>
              <Preview post={currentPost} onUsePrompt={handleUsePrompt} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[500px] bg-brand-surface rounded-xl border-2 border-dashed border-brand-border text-brand-text-secondary">
              <p>Your generated content will appear here.</p>
            </div>
          )}
        </div>
      </div>
      {!isLoading && (
        <Companion
          prompts={promptHistory}
          isLoading={isLoading}
          onSuggestionClick={handleSuggestionClick}
        />
      )}
      <HowItWorks />
    </main>
  );
};
