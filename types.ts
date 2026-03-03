
export enum PostType {
    TEXT = 'text',
    IMAGE = 'image',
    VIDEO = 'video',
    STORY = 'story',
}

export enum MediaType {
    IMAGE = 'image',
    VIDEO = 'video',
    OTHER = 'other',
}

// MediaAsset interface matching Prisma schema
export interface MediaAsset {
    id: string;
    user_id: string;
    url: string;
    type: MediaType; // image, video, etc.
    metadata?: Record<string, any>;
    created_at: string;
}

// Post interface matching Prisma schema
export interface Post {
    id: string;
    user_id: string;
    prompt: string;
    type: PostType; // text, image, video, story, etc.
    storyText?: string; // For story posts, the generated text content
    url: string;
    media_ids: string[];
    metadata?: Record<string, any>;
    created_at: string;
}


export type GenerationType = 'video' | 'story' | 'text' | 'image';


export interface User {
    id?: string;
    email: string;
    name?: string;
    picture?: string;
    credits: number;
    plan?: string;
    created_at: string;
    subscription_id?: string;
    subscription_status?: string;
    stripe_customer_id?: string;
    payment_history?: PaymentHistory[];
    generation_stats?: GenerationStat[];
}


export interface ProcessedSession {
    session_id: string;
    processed_at: string;
}


export interface PaymentHistory {
    id: string;
    user_id: string;
    amount?: number;
    plan?: string;
    credits?: number;
    stripe_session_id?: string;
    created_at: string;
}


export interface GenerationStat {
    id: string;
    user_id: string;
    type: GenerationType;
    count: number;
    last_generated_at: string;
}
