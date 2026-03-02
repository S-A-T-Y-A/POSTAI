
export enum PostType {
    TEXT = 'text',
    IMAGE = 'image',
    VIDEO = 'video',
    STORY = 'story',
}

export interface Post {
    id: string;
    type: PostType;
    prompt: string;
    content: string; // URL for image/video, text content for text
    storyText?: string; // For generated text accompanying a story video
    timestamp: Date;
}
// TypeScript types matching the Prisma schema


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
