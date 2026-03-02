import { PostType } from '../types';

export const CREDIT_COSTS: Record<PostType, number> = {
    [PostType.TEXT]: 1,
    [PostType.IMAGE]: 2,
    [PostType.VIDEO]: 15,
    [PostType.STORY]: 15,
};
