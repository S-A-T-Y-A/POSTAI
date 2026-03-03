import React, { useState, useCallback, useEffect } from "react";
import { FaGoogleDrive } from "react-icons/fa";
import { Header } from "./components/Header";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ApiKeySelector } from "./components/ApiKeySelector";
import { Post, PostType } from "./types";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { uploadFileToGoogleDrive } from "./services/googleDriveUpload";
// Define subscription plans
enum SubscriptionPlan {
  FREE = "Free",
  BASIC = "Basic",
  PRO = "Pro",
  BUSINESS = "Business",
}

interface PlanDetails {
  name: SubscriptionPlan;
  price: number;
  credits: number;
}

const plans: Record<SubscriptionPlan, PlanDetails> = {
  [SubscriptionPlan.FREE]: {
    name: SubscriptionPlan.FREE,
    price: 0,
    credits: 5,
  },
  [SubscriptionPlan.BASIC]: {
    name: SubscriptionPlan.BASIC,
    price: 15,
    credits: 40,
  },
  [SubscriptionPlan.PRO]: {
    name: SubscriptionPlan.PRO,
    price: 30,
    credits: 80,
  },
  [SubscriptionPlan.BUSINESS]: {
    name: SubscriptionPlan.BUSINESS,
    price: 60,
    credits: 200,
  },
};
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { MainPage } from "./components/MainPage";
import { PlansPage } from "./components/PlansPage";
import { ProfilePage } from "./components/ProfilePage";
import { LandingPage } from "./components/LandingPage";
import { UserProvider, useUser } from "./src/contexts/UserContext";
import {
  generateTextPost,
  generateImagePost,
  generateVideoPost,
  generateStoryPost,
  VideoGenerationStatus,
} from "./services/aiService";
import { CREDIT_COSTS } from "./src/constants";

// This is a polyfill for aistudio, for local development
if (typeof window !== "undefined" && !(window as any).aistudio) {
  console.log("Polyfilling window.aistudio for local development.");
  (window as any).aistudio = {
    hasSelectedApiKey: () => new Promise((resolve) => resolve(true)),
    openSelectKey: () => new Promise((resolve) => resolve(true)),
  };
}

const AppContent: React.FC = () => {
  const { user, refreshUser, login, accessToken } = useUser();
  const [showDriveAuthModal, setShowDriveAuthModal] = useState(false);
  // Prompt user to re-authenticate with Google if logged in but no accessToken
  useEffect(() => {
    if (user && !accessToken) {
      setShowDriveAuthModal(true);
    } else {
      setShowDriveAuthModal(false);
    }
  }, [user, accessToken, login]);

  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem("postai_posts");
    return saved ? JSON.parse(saved) : [];
  });
  const [currentPost, setCurrentPost] = useState<Post | null>(() => {
    const saved = localStorage.getItem("postai_currentPost");
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isApiKeySelected, setIsApiKeySelected] = useState<boolean | null>(
    null,
  );
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>(
    SubscriptionPlan.FREE,
  );
  const [credits, setCredits] = useState<number>(
    plans[SubscriptionPlan.FREE].credits,
  );

  useEffect(() => {
    if (user) {
      setCredits(user.credits);
      setCurrentPlan(user.plan as SubscriptionPlan);
    }
  }, [user]);

  // Helper to sanitize post content before saving
  const sanitizePost = (post: Post | null): Post | null => {
    if (!post) return null;
    // For image posts, keep the Drive URL as content
    if (
      post.type === "image" &&
      post.url &&
      post.url.startsWith("https://drive.google.com/uc?id=")
    ) {
      return { ...post };
    }
    // Remove base64 data URLs from all string fields for other post types
    const sanitized: any = { ...post };
    Object.keys(sanitized).forEach((key) => {
      if (
        typeof sanitized[key] === "string" &&
        sanitized[key].startsWith("data:")
      ) {
        sanitized[key] = "[large data omitted]";
      }
    });
    return sanitized;
  };

  const sanitizePosts = (posts: Post[]): Post[] => {
    return posts.map((post) => sanitizePost(post) as Post);
  };

  // Persist posts and currentPost to localStorage (sanitize only for storage)
  useEffect(() => {
    localStorage.setItem("postai_posts", JSON.stringify(sanitizePosts(posts)));
  }, [posts]);
  useEffect(() => {
    localStorage.setItem(
      "postai_currentPost",
      JSON.stringify(sanitizePost(currentPost)),
    );
  }, [currentPost]);

  const checkApiKey = useCallback(async () => {
    try {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      setIsApiKeySelected(hasKey);
    } catch (e) {
      console.error("Error checking for API key:", e);
      setIsApiKeySelected(false);
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  // Get accessToken from UserContext at top level
  //   const { accessToken } = useUser();

  const handleGenerate = async (
    prompt: string,
    type: PostType,
    images: string[] | null,
  ) => {
    if (!user) {
      setError("Please sign in to generate content.");
      login();
      return;
    }

    // Check subscription status for paid plans
    if (user.plan !== "Free" && user.subscription_status !== "active") {
      setError(
        "Your subscription is not active. Please check your payment status on the Plans page.",
      );
      navigate("/plans");
      return;
    }

    const cost = CREDIT_COSTS[type];
    if (credits < cost) {
      setError("You have no credits left. Please upgrade your plan.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setCurrentPost(null);

    try {
      // 1. Generate post content as before
      let generatedContent: any = {};
      const image = images && images.length > 0 ? images[0] : null;
      if (type === PostType.TEXT) {
        setLoadingMessage("Crafting your text post...");
        generatedContent.content = await generateTextPost(prompt, image);
      } else if (type === PostType.IMAGE) {
        setLoadingMessage("Generating your masterpiece...");
        generatedContent.content = await generateImagePost(prompt, image);
      } else if (type === PostType.VIDEO) {
        if (!isApiKeySelected) {
          setError("API key is required for video generation.");
          setIsLoading(false);
          return;
        }
        const onProgress = (status: VideoGenerationStatus) =>
          setLoadingMessage(status.message);
        generatedContent.content = await generateVideoPost(
          prompt,
          onProgress,
          images,
        );
      } else if (type === PostType.STORY) {
        if (!isApiKeySelected) {
          setError("API key is required for story generation.");
          setIsLoading(false);
          return;
        }
        if (!images || images.length === 0) {
          setError("Please upload at least one image to generate a story.");
          setIsLoading(false);
          return;
        }
        const onProgress = (status: VideoGenerationStatus) =>
          setLoadingMessage(status.message);
        const storyResult = await generateStoryPost(prompt, onProgress, images);
        generatedContent.content = storyResult.videoUrl;
        generatedContent.storyText = storyResult.storyText;
      }

      // 2. Prepare file upload data
      let fileBlob = null,
        fileName = null,
        mimeType = null;
      if (
        (type === PostType.IMAGE ||
          type === PostType.VIDEO ||
          type === PostType.STORY) &&
        generatedContent.content
      ) {
        try {
          let blob;
          if (type === PostType.IMAGE) {
            // Convert data URL to Blob for image
            const arr = generatedContent.content.split(",");
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            blob = new Blob([u8arr], { type: mime });
            fileName = `generated-image-${Date.now()}.png`;
            mimeType = mime;
          } else {
            // Fetch video/story from URL and get Blob
            const response = await fetch(generatedContent.content);
            blob = await response.blob();
            fileName =
              type === PostType.VIDEO
                ? `generated-video-${Date.now()}.mp4`
                : `generated-story-${Date.now()}.mp4`;
            mimeType = "video/mp4";
          }
          fileBlob = blob;
        } catch (err) {
          console.error("Failed to prepare file blob", err);
        }
      }

      // 3. Create post in Supabase via backend
      if (fileBlob) {
        // Define storyText for text/story posts
        const storyText =
          type === "story" && generatedContent.storyText
            ? generatedContent.storyText
            : type === "text" && generatedContent.content
              ? generatedContent.content
              : undefined;
        const formData = new FormData();
        if (user.id) formData.append("userId", user.id);
        if (prompt) formData.append("prompt", prompt);
        if (type) formData.append("type", type);
        if (storyText) formData.append("storyText", storyText);
        if (fileBlob) formData.append("file", fileBlob, fileName || "file.mp4");
        const postResponse = await fetch("/api/posts/create", {
          method: "POST",
          body: formData,
        });
        if (!postResponse.ok) {
          throw new Error("Failed to create post in Supabase.");
        }
        const { post } = await postResponse.json();

        // 4. Deduct credits on backend
        const deductResponse = await fetch("/api/user/deduct-credits", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-email": user.email,
          },
          body: JSON.stringify({ amount: cost }),
        });
        if (!deductResponse.ok) {
          throw new Error("Failed to deduct credits.");
        }

        // 5. Update frontend state with Supabase post
        setCurrentPost(post);
        setPosts((prevPosts) => [post, ...prevPosts]);
        refreshUser(); // Sync user credits
      } else {
        // Fallback for text only
        const postPayload = {
          userId: user.id,
          prompt: prompt,
          type,
          ...(type === "text" && generatedContent.content
            ? { storyText: generatedContent.content }
            : {}),
          ...(type === "story" && generatedContent.storyText
            ? { storyText: generatedContent.storyText }
            : {}),
        };
        const postResponse = await fetch("/api/posts/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-email": user.email,
          },
          body: JSON.stringify(postPayload),
        });
        if (!postResponse.ok) {
          throw new Error("Failed to create post in Supabase.");
        }
        const { post } = await postResponse.json();

        // 4. Deduct credits on backend
        const deductResponse = await fetch("/api/user/deduct-credits", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-email": user.email,
          },
          body: JSON.stringify({ amount: cost }),
        });
        if (!deductResponse.ok) {
          throw new Error("Failed to deduct credits.");
        }

        // 5. Update frontend state with Supabase post
        setCurrentPost(post);
        setPosts((prevPosts) => [post, ...prevPosts]);
        refreshUser(); // Sync user credits
      }
    } catch (e: any) {
      console.error("Generation failed:", e);
      const errorMessage = e.message || "An unexpected error occurred.";
      setError(errorMessage);
      if (errorMessage.includes("Requested entity was not found")) {
        setError(
          "Your API key is invalid. Please select a valid key to generate videos.",
        );
        setIsApiKeySelected(false);
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleSelectPost = (post: Post) => {
    setCurrentPost(post);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (showDriveAuthModal) {
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.4)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#18181b",
          color: "#fff",
          borderRadius: 12,
          padding: "2rem 2.5rem",
          boxShadow: "0 4px 32px rgba(0,0,0,0.25)",
          minWidth: 320,
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Google Drive Sync</h2>
        <p style={{ marginBottom: 24 }}>
          Please authenticate with Google to sync your results to Drive.
        </p>
        <button
          style={{
            background: "linear-gradient(90deg,#6366f1,#a21caf)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "0.75rem 2rem",
            fontWeight: 600,
            fontSize: 16,
            cursor: "pointer",
          }}
          onClick={() => {
            setShowDriveAuthModal(false);
            login();
          }}
        >
          Authenticate
        </button>
      </div>
    </div>;
  }

  return (
    <>
      {showDriveAuthModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.4)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "fadeInBg 0.5s",
          }}
        >
          <style>{`
          @keyframes fadeInBg {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.08); }
            100% { transform: scale(1); }
          }
          @keyframes connect {
            0% { stroke-dashoffset: 60; }
            100% { stroke-dashoffset: 0; }
          }
        `}</style>
          <div
            style={{
              background: "#18181b",
              color: "#fff",
              borderRadius: 16,
              padding: "2.5rem 2.5rem 2rem 2.5rem",
              boxShadow: "0 4px 32px rgba(0,0,0,0.25)",
              minWidth: 340,
              textAlign: "center",
              position: "relative",
              animation: "fadeInBg 0.7s",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              {/* Google Drive Icon */}
              <FaGoogleDrive
                size={48}
                color="#34a853"
                style={{ marginRight: 16, animation: "pulse 1.2s infinite" }}
              />
              {/* Connecting Animation */}
              <svg
                width="60"
                height="32"
                viewBox="0 0 60 32"
                style={{ margin: "0 8px" }}
              >
                <line
                  x1="0"
                  y1="16"
                  x2="60"
                  y2="16"
                  stroke="#a21caf"
                  strokeWidth="4"
                  strokeDasharray="60"
                  strokeDashoffset="0"
                  style={{
                    animation: "connect 1.2s linear infinite alternate",
                  }}
                />
              </svg>
              {/* POSTAI Icon (favicon) */}
              <img
                src="/favicon.svg"
                alt="POSTAI"
                width={44}
                height={44}
                style={{
                  marginLeft: 16,
                  borderRadius: 12,
                  animation: "pulse 1.2s infinite 0.3s",
                  background: "#fff",
                }}
              />
            </div>
            <h2
              style={{
                fontSize: 22,
                marginBottom: 10,
                fontWeight: 700,
                letterSpacing: 0.5,
              }}
            >
              Connect Google Drive
            </h2>
            <p style={{ marginBottom: 28, color: "#c7d2fe", fontSize: 16 }}>
              To sync your results to Google Drive, please authenticate your
              account.
              <br />
              <span style={{ color: "#a21caf", fontWeight: 500 }}>
                Secure & private
              </span>
            </p>
            <button
              style={{
                background: "linear-gradient(90deg,#6366f1,#a21caf)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "0.85rem 2.2rem",
                fontWeight: 700,
                fontSize: 17,
                cursor: "pointer",
                boxShadow: "0 2px 12px #6366f133",
                transition: "background 0.2s",
                marginBottom: 8,
              }}
              onClick={() => {
                setShowDriveAuthModal(false);
                login();
              }}
            >
              <span
                role="img"
                aria-label="Google Drive"
                style={{ marginRight: 8 }}
              >
                🔗
              </span>
              Authenticate with Google
            </button>
            <div style={{ fontSize: 13, color: "#a3a3a3", marginTop: 10 }}>
              You will be redirected to Google for secure authentication.
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-brand-bg bg-gradient-to-br from-brand-bg via-[#101622] to-brand-secondary/20 font-sans">
        <Header />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/dashboard"
            element={
              <MainPage
                posts={posts}
                currentPost={currentPost}
                isLoading={isLoading}
                loadingMessage={loadingMessage}
                error={error}
                isApiKeySelected={isApiKeySelected}
                handleGenerate={handleGenerate}
                handleSelectPost={handleSelectPost}
                credits={credits}
              />
            }
          />
          <Route
            path="/plans"
            element={<PlansPage currentPlan={currentPlan} credits={credits} />}
          />
          <Route path="/profile" element={<ProfilePage />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {isApiKeySelected === false && (
          <ApiKeySelector
            onKeySelected={() => {
              setIsApiKeySelected(true);
              setError(null);
            }}
          />
        )}
      </div>
    </>
  );
};

import { ThemeProvider, useTheme } from "./src/contexts/ThemeContext";

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 1000,
        padding: "8px 16px",
        borderRadius: 8,
        background: theme === "dark" ? "#222" : "#eee",
        color: theme === "dark" ? "#fff" : "#222",
        border: "none",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        cursor: "pointer",
      }}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
};

const AppContentWithTheme: React.FC = () => (
  <>
    <ThemeToggle />
    <AppContent />
  </>
);

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <UserProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <AppContentWithTheme />
          </ErrorBoundary>
        </BrowserRouter>
      </UserProvider>
    </ThemeProvider>
  );
};

export default App;
