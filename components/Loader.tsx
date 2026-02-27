
import React from 'react';

interface LoaderProps {
    message: string;
}

export const Loader: React.FC<LoaderProps> = ({ message }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 transition-opacity duration-300">
            <div className="w-16 h-16 border-4 border-brand-primary/50 border-t-brand-primary rounded-full animate-spin"></div>
            <p className="mt-4 text-white text-lg font-semibold animate-pulse">{message}</p>
        </div>
    );
};
