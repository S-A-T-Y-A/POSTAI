import React from 'react';
import { PostCreator } from './PostCreator';
import { Preview } from './Preview';
import { History } from './History';
import { Loader } from './Loader';
import { HowItWorks } from './HowItWorks';
import { Post, PostType } from '../types';
import { CREDIT_COSTS } from '../src/constants';

interface MainPageProps {
    posts: Post[];
    currentPost: Post | null;
    isLoading: boolean;
    loadingMessage: string;
    error: string | null;
    isApiKeySelected: boolean | null;
    handleGenerate: (prompt: string, type: PostType, images: string[] | null) => void;
    handleSelectPost: (post: Post) => void;
    credits: number;
}

export const MainPage: React.FC<MainPageProps> = ({ 
    posts, currentPost, isLoading, loadingMessage, error, isApiKeySelected, handleGenerate, handleSelectPost, credits 
}) => {
    return (
        <main className="container mx-auto p-4 md:p-8 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="lg:col-span-1 space-y-8">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg relative animate-fade-in" role="alert">
                            <strong className="font-bold">Oops! </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center bg-brand-surface rounded-xl border border-brand-border shadow-2xl p-6 animate-fade-in">
                        <h2 className="text-2xl font-bold text-brand-text">Create Content</h2>
                        <div className="text-right">
                            <p className="text-lg font-semibold text-brand-primary">Credits</p>
                            <p className="text-sm text-brand-text-secondary">{credits} remaining</p>
                        </div>
                    </div>
                    <div className="bg-brand-surface rounded-xl border border-brand-border shadow-2xl p-6 animate-fade-in">
                        <PostCreator onGenerate={handleGenerate} isLoading={isLoading} isApiKeySelectedForVideo={isApiKeySelected} creditCosts={CREDIT_COSTS} />
                    </div>
                    {posts.length > 0 && (
                        <div className="mt-12 animate-fade-in">
                            <h2 className="text-2xl font-bold mb-4 text-brand-text">History</h2>
                            <History posts={posts} onSelectPost={handleSelectPost} />
                        </div>
                    )}
                </div>
                <div className="lg:col-span-1 lg:sticky top-8 overflow-y-auto pr-4">
                    {isLoading && <Loader message={loadingMessage} />}
                    {currentPost ? (
                        <div className="animate-fade-in">
                            <h2 className="text-2xl font-bold mb-4 text-brand-text">Preview</h2>
                            <Preview post={currentPost} />
                        </div>
                    ) : (
                        !isLoading && (
                            <div className="flex items-center justify-center h-full bg-brand-surface rounded-xl border-2 border-dashed border-brand-border text-brand-text-secondary">
                                <p>Your generated content will appear here.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
            <HowItWorks />
        </main>
    );
};
