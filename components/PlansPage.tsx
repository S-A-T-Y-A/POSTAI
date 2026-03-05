import React, { useEffect, useState } from 'react';
import { SubscriptionManager } from './SubscriptionManager';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useUser } from '../src/contexts/UserContext';
import { CheckCircle2, PartyPopper } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HowItWorks } from './HowItWorks';

enum SubscriptionPlan {
    FREE = 'Free',
    BASIC = 'Basic',
    PRO = 'Pro',
    BUSINESS = 'Business',
}

interface PlansPageProps {
    currentPlan: SubscriptionPlan;
    credits: number;
}

export const PlansPage: React.FC<PlansPageProps> = ({ currentPlan, credits }) => {
    const port= process.env.PORT || 8080;
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { refreshUser, user } = useUser();
    const [isVerifying, setIsVerifying] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const verifiedRef = React.useRef<string | null>(null);

    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        if (sessionId && user && verifiedRef.current !== sessionId) {
            verifiedRef.current = sessionId;
            verifyPayment(sessionId);
        }
    }, [searchParams, user]);

    const verifyPayment = async (sessionId: string) => {
        setIsVerifying(true);
        try {
            const response = await fetch('/api/payment/success', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-email': localStorage.getItem('postai_user_email') || ''
                },
                body: JSON.stringify({ sessionId })
            });
            if (response.ok) {
                await refreshUser();
                setShowSuccess(true);
                // Redirect after 3 seconds
                setTimeout(() => {
                    navigate('/dashboard');
                }, Number(port));
            }
        } catch (error) {
            console.error('Payment verification failed:', error);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleUpgrade = async (plan: any) => {
        if (!user) {
            alert('Please sign in to upgrade your plan.');
            return;
        }

        try {
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-email': localStorage.getItem('postai_user_email') || ''
                },
                body: JSON.stringify({
                    planName: plan.name,
                    price: plan.price,
                    credits: plan.credits
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                alert(`Failed to start checkout: ${errorData.error || 'Unknown error'}. Please check your Stripe Secret Key.`);
                return;
            }

            const { url } = await response.json();
            if (url) {
                console.log('Opening Stripe in new tab:', url);
                const stripeWindow = window.open(url, '_blank');
                if (!stripeWindow) {
                    alert('Popup blocked! Please allow popups to proceed to checkout.');
                    // Fallback to current window if popup is blocked, though it might fail in iframe
                    window.location.href = url;
                }
            } else {
                alert('Stripe did not return a checkout URL. Please check your Stripe configuration.');
            }
        } catch (error) {
            console.error('Failed to create checkout session:', error);
            alert('An error occurred while trying to start the checkout process.');
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl relative">
            <AnimatePresence>
                {showSuccess && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <div className="bg-brand-surface border border-emerald-500/30 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl shadow-emerald-500/20">
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <PartyPopper className="w-10 h-10 text-emerald-400" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">Payment Successful!</h2>
                            <p className="text-slate-400 text-lg mb-8">
                                Your account has been upgraded. Get ready to create amazing content. Enjoy the features!
                            </p>
                            <div className="flex items-center justify-center space-x-2 text-emerald-400 font-medium">
                                <CheckCircle2 className="w-5 h-5" />
                                <span>Redirecting to Dashboard...</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {isVerifying && (
                <div className="mb-8 p-4 bg-brand-primary/10 border border-brand-primary rounded-xl text-center text-brand-text">
                    Verifying your payment...
                </div>
            )}
            {user?.subscription_status && user.subscription_status !== 'active' && user.plan !== 'Free' && (
                <div className="mb-8 p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
                    <h3 className="text-xl font-bold text-red-400 mb-2">Subscription Issue</h3>
                    <p className="text-red-300/80 mb-4">
                        Your subscription status is currently <strong>{user.subscription_status}</strong>. 
                        Please update your payment method or re-subscribe to continue using premium features.
                    </p>
                </div>
            )}
            <SubscriptionManager 
                currentPlan={currentPlan} 
                credits={credits} 
                onPlanChange={handleUpgrade} 
            />
                        <HowItWorks />
        </div>
    );
};
