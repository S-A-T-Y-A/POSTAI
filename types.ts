
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
