import React from "react";
import Lottie from "lottie-react";
import loadingBot from "../animations/loading_bot.json";

interface LoaderProps {
  message: string;
}

export const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 transition-opacity duration-300">
      <Lottie
        animationData={loadingBot}
        style={{ width: "160px", height: "160px" }}
        loop={true}
      />
      <p className="mt-4 text-white text-lg font-semibold animate-pulse">
        {message}
      </p>
    </div>
  );
};
