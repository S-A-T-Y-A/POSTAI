import React from 'react';
import { Check } from 'lucide-react';
import { PostType } from '../types';
import { CREDIT_COSTS } from '../src/constants';

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
    features: string[];
}

const plans: Record<SubscriptionPlan, PlanDetails> = {
    [SubscriptionPlan.FREE]: { 
        name: SubscriptionPlan.FREE, 
        price: 0, 
        credits: 5, 
        features: [
            `${Math.floor(5 / CREDIT_COSTS[PostType.IMAGE])} Image Generations`,
            `${Math.floor(5 / CREDIT_COSTS[PostType.TEXT])} Text Generations`,
            'No Video Generation'
        ]
    },
    [SubscriptionPlan.BASIC]: { 
        name: SubscriptionPlan.BASIC, 
        price: 15, 
        credits: 40, 
        features: [
            `${Math.floor(40 / CREDIT_COSTS[PostType.VIDEO])} Video/Story Generation`,
            `${Math.floor(40 / CREDIT_COSTS[PostType.IMAGE])} Image Generations`,
            `${Math.floor(40 / CREDIT_COSTS[PostType.TEXT])} Text Generations`,
            'Standard Support'
        ]
    },
    [SubscriptionPlan.PRO]: { 
        name: SubscriptionPlan.PRO, 
        price: 30, 
        credits: 80, 
        features: [
            `${Math.floor(80 / CREDIT_COSTS[PostType.VIDEO])} Video/Story Generations`,
            `${Math.floor(80 / CREDIT_COSTS[PostType.IMAGE])} Image Generations`,
            `${Math.floor(80 / CREDIT_COSTS[PostType.TEXT])} Text Generations`,
            'Priority Support'
        ]
    },
    [SubscriptionPlan.BUSINESS]: { 
        name: SubscriptionPlan.BUSINESS, 
        price: 60, 
        credits: 200, 
        features: [
            `${Math.floor(200 / CREDIT_COSTS[PostType.VIDEO])} Video/Story Generations`,
            `${Math.floor(200 / CREDIT_COSTS[PostType.IMAGE])} Image Generations`,
            `${Math.floor(200 / CREDIT_COSTS[PostType.TEXT])} Text Generations`,
            'Dedicated Support'
        ]
    },
};

interface SubscriptionManagerProps {
    currentPlan: SubscriptionPlan;
    credits: number;
    onPlanChange: (plan: PlanDetails) => void;
}

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ currentPlan, credits, onPlanChange }) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-brand-text">Your Plan</h2>
                <div className="text-right">
                    <p className="text-lg font-semibold text-brand-primary">{currentPlan}</p>
                    <p className="text-sm text-brand-text-secondary">{credits} credits remaining</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Object.values(plans).map(plan => (
                    <div key={plan.name} className={`p-4 rounded-lg border-2 ${currentPlan === plan.name ? 'border-brand-primary' : 'border-brand-border'}`}>
                        <h3 className="text-lg font-bold text-brand-text">{plan.name}</h3>
                        <p className="text-2xl font-bold text-brand-primary">${plan.price}<span className="text-sm font-normal text-brand-text-secondary">/mo</span></p>
                        <p className="text-sm text-brand-text-secondary">{plan.credits} credits</p>
                        <ul className="mt-4 space-y-2 text-left text-sm">
                            {plan.features.map((feature, index) => (
                                <li key={index} className="flex items-center space-x-2">
                                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                    <span className="text-brand-text-secondary">{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <button 
                            onClick={() => onPlanChange(plan)}
                            disabled={currentPlan === plan.name}
                            className="w-full mt-4 py-2 px-4 bg-brand-primary text-white font-semibold rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            {currentPlan === plan.name ? 'Current Plan' : 'Upgrade'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
