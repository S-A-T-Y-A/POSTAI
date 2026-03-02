
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ApiKeySelector } from './components/ApiKeySelector';
import { Post, PostType } from './types';

// Define subscription plans
enum SubscriptionPlan {
    FREE = 'Free',
    BASIC = 'Basic',
    PRO = 'Pro',
    BUSINESS = 'Business',
}

interface PlanDetails {
    name: SubscriptionPlan;
    price: number;
    credits: number;
}

const plans: Record<SubscriptionPlan, PlanDetails> = {
    [SubscriptionPlan.FREE]: { name: SubscriptionPlan.FREE, price: 0, credits: 5 },
    [SubscriptionPlan.BASIC]: { name: SubscriptionPlan.BASIC, price: 15, credits: 40 },
    [SubscriptionPlan.PRO]: { name: SubscriptionPlan.PRO, price: 30, credits: 80 },
    [SubscriptionPlan.BUSINESS]: { name: SubscriptionPlan.BUSINESS, price: 60, credits: 200 },
};
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { MainPage } from './components/MainPage';
import { PlansPage } from './components/PlansPage';
import { ProfilePage } from './components/ProfilePage';
import { LandingPage } from './components/LandingPage';
import { UserProvider, useUser } from './src/contexts/UserContext';
import { generateTextPost, generateImagePost, generateVideoPost, generateStoryPost, VideoGenerationStatus } from './services/aiService';
import { CREDIT_COSTS } from './src/constants';

// This is a polyfill for aistudio, for local development
if (typeof window !== 'undefined' && !(window as any).aistudio) {
  console.log('Polyfilling window.aistudio for local development.');
  (window as any).aistudio = {
    hasSelectedApiKey: () => new Promise(resolve => resolve(true)),
    openSelectKey: () => new Promise(resolve => resolve(true)),
  };
}


const AppContent: React.FC = () => {
    const { user, refreshUser, login } = useUser();
    const navigate = useNavigate();
    const [posts, setPosts] = useState<Post[]>([]);
    const [currentPost, setCurrentPost] = useState<Post | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isApiKeySelected, setIsApiKeySelected] = useState<boolean | null>(null);
    const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>(SubscriptionPlan.FREE);
    const [credits, setCredits] = useState<number>(plans[SubscriptionPlan.FREE].credits);

    useEffect(() => {
        if (user) {
            setCredits(user.credits);
            setCurrentPlan(user.plan as SubscriptionPlan);
        }
    }, [user]);

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

    const handleGenerate = async (prompt: string, type: PostType, images: string[] | null) => {
        if (!user) {
            setError("Please sign in to generate content.");
            login();
            return;
        }

        // Check subscription status for paid plans
        if (user.plan !== 'Free' && user.subscription_status !== 'active') {
            setError("Your subscription is not active. Please check your payment status on the Plans page.");
            navigate('/plans');
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
            let newPost: Post | null = null;
            const image = images && images.length > 0 ? images[0] : null;

            if (type === PostType.TEXT) {
                setLoadingMessage('Crafting your text post...');
                const text = await generateTextPost(prompt, image);
                newPost = { id: Date.now().toString(), type, prompt, content: text, timestamp: new Date() };
            } else if (type === PostType.IMAGE) {
                setLoadingMessage('Generating your masterpiece...');
                const imageUrl = await generateImagePost(prompt, image);
                newPost = { id: Date.now().toString(), type, prompt, content: imageUrl, timestamp: new Date() };
            } else if (type === PostType.VIDEO) {
                 if (!isApiKeySelected) {
                    setError("API key is required for video generation.");
                    setIsLoading(false);
                    return;
                }
                const onProgress = (status: VideoGenerationStatus) => setLoadingMessage(status.message);
                const videoUrl = await generateVideoPost(prompt, onProgress, images);
                newPost = { id: Date.now().toString(), type, prompt, content: videoUrl, timestamp: new Date() };
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
                const onProgress = (status: VideoGenerationStatus) => setLoadingMessage(status.message);
                const { videoUrl, storyText } = await generateStoryPost(prompt, onProgress, images);
                newPost = { id: Date.now().toString(), type, prompt, content: videoUrl, storyText, timestamp: new Date() };
            }

            if (newPost) {
                // Deduct credits on backend
                const deductResponse = await fetch('/api/user/deduct-credits', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-user-email': localStorage.getItem('postai_user_email') || ''
                    },
                    body: JSON.stringify({ amount: cost })
                });
                
                if (!deductResponse.ok) {
                    throw new Error("Failed to deduct credits.");
                }

                setCurrentPost(newPost);
                setPosts(prevPosts => [newPost!, ...prevPosts]);
                refreshUser(); // Sync user credits
            }
        } catch (e: any) {
            console.error("Generation failed:", e);
            const errorMessage = e.message || "An unexpected error occurred.";
            setError(errorMessage);
            if (errorMessage.includes("Requested entity was not found")) {
                 setError("Your API key is invalid. Please select a valid key to generate videos.");
                 setIsApiKeySelected(false);
            }
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleSelectPost = (post: Post) => {
        setCurrentPost(post);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-brand-bg bg-gradient-to-br from-brand-bg via-[#101622] to-brand-secondary/20 font-sans">
            <Header />
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<MainPage 
                    posts={posts} 
                    currentPost={currentPost} 
                    isLoading={isLoading} 
                    loadingMessage={loadingMessage} 
                    error={error} 
                    isApiKeySelected={isApiKeySelected} 
                    handleGenerate={handleGenerate} 
                    handleSelectPost={handleSelectPost} 
                    credits={credits} 
                />} />
                <Route path="/plans" element={<PlansPage 
                    currentPlan={currentPlan} 
                    credits={credits} 
                />} />
                <Route path="/profile" element={<ProfilePage />} />
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            {isApiKeySelected === false && (
                <ApiKeySelector onKeySelected={() => {
                    setIsApiKeySelected(true);
                    setError(null);
                }}/>
            )}
        </div>
    );
};

const App: React.FC = () => {
    return (
        <UserProvider>
            <BrowserRouter>
                <AppContent />
            </BrowserRouter>
        </UserProvider>
    );
};

export default App;
