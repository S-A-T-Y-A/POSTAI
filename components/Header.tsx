
import React from 'react';
import { Film, Image, Type, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '../src/contexts/UserContext';

export const Header: React.FC = () => {
    const { user, login, loading } = useUser();

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
                            Post<span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">AI</span>
                        </h1>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-brand-text-secondary font-bold opacity-60">by Bitforz</span>
                    </div>
                </Link>
                
                <div className="flex items-center space-x-6">
                    <nav className="hidden md:flex items-center space-x-6">
                        <Link to="/" className="text-sm font-medium text-brand-text-secondary hover:text-brand-text transition-colors">Home</Link>
                        <Link to="/dashboard" className="text-sm font-medium text-brand-text-secondary hover:text-brand-text transition-colors">Dashboard</Link>
                        <Link to="/plans" className="text-sm font-medium text-brand-text-secondary hover:text-brand-text transition-colors">Plans</Link>
                    </nav>

                    <div className="h-6 w-px bg-brand-border hidden md:block"></div>

                    {loading ? (
                        <div className="h-8 w-8 rounded-full bg-brand-bg animate-pulse"></div>
                    ) : user ? (
                        <Link to="/profile" className="flex items-center space-x-3 p-1 pr-3 hover:bg-brand-bg rounded-full border border-transparent hover:border-brand-border transition-all">
                            <img src={user.picture} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
                            <span className="text-sm font-semibold text-brand-text hidden sm:inline">{user.name.split(' ')[0]}</span>
                        </Link>
                    ) : (
                        <button 
                            onClick={login}
                            className="flex items-center px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-brand-primary/20"
                        >
                            <LogIn size={16} className="mr-2" />
                            Sign In
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};
