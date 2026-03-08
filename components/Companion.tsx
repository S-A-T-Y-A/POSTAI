import React, { useEffect, useState } from "react";
import Lottie from "lottie-react";
import spaceKidTyping from "../animations/space_kid_typing.json";
import loadingBot from "../animations/loading_bot.json";

// Simple animated SVG mascot (can be replaced with Lottie or other)
const mascotSvg = (
  <svg
    width="60"
    height="60"
    viewBox="0 0 60 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="30"
      cy="30"
      r="28"
      fill="#6C63FF"
      stroke="#333"
      strokeWidth="2"
    />
    <ellipse cx="22" cy="28" rx="4" ry="6" fill="#fff" />
    <ellipse cx="38" cy="28" rx="4" ry="6" fill="#fff" />
    <circle cx="22" cy="30" r="2" fill="#333" />
    <circle cx="38" cy="30" r="2" fill="#333" />
    <path d="M22 40 Q30 45 38 40" stroke="#333" strokeWidth="2" fill="none" />
  </svg>
);

const SUGGESTIONS = [
  "Try a post about eco-friendly office setups!",
  "Want to try generating a video next?",
  "How about a story post for your next idea?",
  "Use more descriptive prompts for better results!",
];

export const Companion: React.FC<{
  prompts: string[];
  isLoading?: boolean;
  onSuggestionClick?: (suggestion: string) => void;
}> = ({ prompts, isLoading, onSuggestionClick }) => {
  const [suggestion, setSuggestion] = useState("");
  const [showSuggestion, setShowSuggestion] = useState(false);

  // Helper to generate suggestion from last prompt
  const generateSuggestion = () => {
    if (prompts.length > 0) {
      const lastPrompt = prompts[prompts.length - 1].toLowerCase();
      let idea = "Try something new!";
      if (
        lastPrompt.includes("eco") ||
        lastPrompt.includes("green") ||
        lastPrompt.includes("organic")
      ) {
        idea = "How about a post on sustainable office gear?";
      } else if (lastPrompt.includes("video")) {
        idea = "Try generating a story video next!";
      } else if (lastPrompt.includes("chair")) {
        idea = "Explore ergonomic desk setups!";
      } else if (lastPrompt.includes("story")) {
        idea = "Use more images for richer stories!";
      } else if (lastPrompt.length < 20) {
        idea = "Add more details to your prompt for better results!";
      }
      return idea;
    }
    return "Try something new!";
  };

  // Learn from prompts and suggest ideas
  useEffect(() => {
    if (prompts.length > 0) {
      const idea = generateSuggestion();
      setSuggestion(idea);
      setShowSuggestion(true);
      const timeout = setTimeout(() => setShowSuggestion(false), 7000);
      return () => clearTimeout(timeout);
    }
  }, [prompts]);

  // Show suggestion bubble when companion is clicked
  const handleShowSuggestion = () => {
    const idea = generateSuggestion();
    setSuggestion(idea);
    setShowSuggestion(true);
    setTimeout(() => setShowSuggestion(false), 7000);
  };

  return (
    <div
      className="fixed left-2 bottom-2 md:left-8 md:bottom-8 z-[1000] cursor-pointer transition-all duration-500 ease-[cubic-bezier(.68,-0.55,.27,1.55)]"
      title="I'm your companion!"
      onClick={handleShowSuggestion}
    >
      {/* Suggestion bubble in top right of companion */}
      {showSuggestion && !isLoading && (
        <div
          className="absolute -top-4 -right-2 md:-top-6 md:-right-4 bg-white text-black rounded-lg shadow-lg p-1.5 px-3 md:p-2 md:px-4 text-[10px] md:text-sm max-w-[160px] md:max-w-[220px] text-center z-[1001] cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (onSuggestionClick) onSuggestionClick(suggestion);
          }}
          title="Click to use this idea"
        >
          {suggestion}
        </div>
      )}
      <div className="w-[80px] h-[80px] md:w-[200px] md:h-[200px] max-w-[60vw] max-h-[30vh]">
        <Lottie
          animationData={isLoading ? loadingBot : spaceKidTyping}
          style={{ width: "100%", height: "100%" }}
          loop={true}
        />
      </div>
    </div>
  );
};
