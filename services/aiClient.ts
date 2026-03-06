import { VideoGenerationStatus } from "../types.js";

export const generateTextPost = async (prompt: string, imageDataUrl?: string | null): Promise<string> => {
    const response = await fetch('/api/ai/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, imageDataUrl }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate text post.");
    }
    const data = await response.json();
    return data.text;
};

export const generateImagePost = async (prompt: string, imageDataUrl?: string | null): Promise<string> => {
    const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, imageDataUrl }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate image post.");
    }
    const data = await response.json();
    return data.imageUrl;
};

export const generateVideoPost = async (
    prompt: string,
    onProgress: (status: VideoGenerationStatus) => void,
    images: string[] | null
): Promise<string> => {
    // For long-running video generation, we might need a different approach (e.g., polling)
    // but for now let's try a simple POST if the server can wait.
    onProgress({ message: "Video generation...", progress: 0 });

    // Note: This matches the existing logic where progress is simulated on the client
    // or received via some mechanism. Since we're moving to backend,
    // we'll try to use the same simulated progress for now or improve it later.
    const response = await fetch('/api/ai/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, images }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate video.");
    }

    const data = await response.json();
    onProgress({ message: "Video generation complete!", progress: 100 });
    return data.videoUrl;
};

export const generateStoryPost = async (
    prompt: string,
    onProgress: (status: VideoGenerationStatus) => void,
    images: string[]
): Promise<{ videoUrl: string, storyText: string }> => {
    onProgress({ message: "Story generation...", progress: 0 });
    const response = await fetch('/api/ai/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, images }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate story.");
    }

    const data = await response.json();
    onProgress({ message: "Story generation complete!", progress: 100 });
    return data;
};
