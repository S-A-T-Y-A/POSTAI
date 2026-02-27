import { PostType } from '../types';

export const CREDIT_COSTS: Record<PostType, number> = {
    [PostType.TEXT]: 1,
    [PostType.IMAGE]: 2,
    [PostType.VIDEO]: 35,
    [PostType.STORY]: 35,
};
