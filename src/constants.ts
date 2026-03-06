import { PostType, SubscriptionPlan } from '../types';

export const CREDIT_COSTS: Record<PostType, number> = {
    [PostType.TEXT]: 1,
    [PostType.IMAGE]: 2,
    [PostType.VIDEO]: 15,
    [PostType.STORY]: 16,
};
export const HISTORY_LIMIT: Record<SubscriptionPlan, number> = {
    [SubscriptionPlan.FREE]: 20,
    [SubscriptionPlan.BASIC]: 50,
    [SubscriptionPlan.PRO]: 100,
    [SubscriptionPlan.BUSINESS]: 200,
};

