import React, { useState } from "react";
import { Film, Image, Type, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { useUser } from "../src/contexts/UserContext";

export const Header: React.FC = () => {
  const { user, login, loading } = useUser();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-brand-surface/80 backdrop-blur-md border-b border-brand-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="flex -space-x-2 transition-transform group-hover:scale-110 duration-300">
            <Type className="h-8 w-8 text-blue-400 p-1.5 bg-blue-500/10 rounded-full" />
            <Image className="h-8 w-8 text-purple-400 p-1.5 bg-purple-500/10 rounded-full" />
            <Film className="h-8 w-8 text-indigo-400 p-1.5 bg-indigo-500/10 rounded-full" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-extrabold text-brand-text tracking-tight leading-none">
              Post
              <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">
                AI
              </span>
            </h1>
            <span className="text-[10px] uppercase tracking-[0.2em] text-brand-text-secondary font-bold opacity-60">
              by Bitforz
            </span>
          </div>
        </Link>

        <div className="flex items-center space-x-6">
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="text-sm font-medium text-brand-text-secondary hover:text-brand-text transition-colors"
            >
              Home
            </Link>
            <Link
              to="/dashboard"
              className="text-sm font-medium text-brand-text-secondary hover:text-brand-text transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/plans"
              className="text-sm font-medium text-brand-text-secondary hover:text-brand-text transition-colors"
            >
              Plans
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden flex items-center justify-center p-2 rounded-lg hover:bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-primary"
            aria-label="Open menu"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <svg
              className="h-6 w-6 text-brand-text"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="h-6 w-px bg-brand-border hidden md:block"></div>

          {loading ? (
            <div className="h-8 w-8 rounded-full bg-brand-bg animate-pulse"></div>
          ) : user ? (
            <Link
              to="/profile"
              className="flex items-center space-x-3 p-1 pr-3 hover:bg-brand-bg rounded-full border border-transparent hover:border-brand-border transition-all"
            >
              <img
                src={user.picture}
                alt={user.name}
                className="h-8 w-8 rounded-full object-cover"
              />
              <span className="text-sm font-semibold text-brand-text hidden sm:inline">
                {user.name?.split(" ")[0]}
              </span>
            </Link>
          ) : (
            <button
              onClick={login}
              className="flex items-center px-3 py-1.5 md:px-4 md:py-2 bg-brand-primary hover:bg-brand-primary/90 text-white text-xs md:text-sm font-bold rounded-xl transition-all shadow-lg shadow-brand-primary/20"
            >
              <LogIn size={14} className="mr-1.5 md:size-[16px] md:mr-2" />
              Sign In
            </button>
          )}
        </div>
        {/* Mobile nav dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-brand-surface border-b border-brand-border shadow-lg z-40 animate-fade-in">
            <nav className="flex flex-col py-2 px-4 space-y-2">
              <Link
                to="/"
                className="text-base font-medium text-brand-text-secondary hover:text-brand-text transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/dashboard"
                className="text-base font-medium text-brand-text-secondary hover:text-brand-text transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/plans"
                className="text-base font-medium text-brand-text-secondary hover:text-brand-text transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Plans
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
