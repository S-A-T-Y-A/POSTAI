
import { GoogleGenAI } from "@google/genai";

export interface VideoGenerationStatus {
    message: string;
    progress: number;
}

const getAiClient = () => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    // Create a new instance for each call to ensure the latest API key is used, especially for Veo.
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

function dataUrlToAiPart(dataUrl: string): { mimeType: string; data: string } {
    const parts = dataUrl.split(',');
    const mimeType = parts[0].split(':')[1].split(';')[0];
    const data = parts[1];
    return { mimeType, data };
}


export const generateTextPost = async (prompt: string, imageDataUrl?: string | null): Promise<string> => {
    try {
        const ai = getAiClient();
        
        const contentParts: any[] = [];
        if (imageDataUrl) {
            contentParts.push({ inlineData: dataUrlToAiPart(imageDataUrl) });
        }
        contentParts.push({ text: prompt || "Describe this image." });

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: contentParts },
        });

        const text = response.text;
        if (!text) {
             throw new Error("No text content generated.");
        }
        return text;
    } catch (error) {
        console.error("Text generation error:", error);
        throw new Error("Failed to generate text post.");
    }
};

export const generateImagePost = async (prompt: string, imageDataUrl?: string | null): Promise<string> => {
    try {
        const ai = getAiClient();

        const contentParts: any[] = [];
        if (imageDataUrl) {
            contentParts.push({ inlineData: dataUrlToAiPart(imageDataUrl) });
        }
        contentParts.push({ text: prompt });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: contentParts },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64EncodeString: string = part.inlineData.data;
                return `data:${part.inlineData.mimeType};base64,${base64EncodeString}`;
            }
        }
        throw new Error("No image content generated.");
    } catch (error) {
        console.error("Image generation error:", error);
        throw new Error("Failed to generate image post.");
    }
};

const videoGenerationMessages = [
    "Warming up the video engine...",
    "Scripting the visual narrative...",
    "Casting digital actors...",
    "Rendering the first few frames...",
    "Adding special effects and sparkles...",
    "Compositing scenes together...",
    "Applying final color grading...",
    "Finalizing the video masterpiece...",
];


export const generateStoryPost = async (
    prompt: string, 
    onProgress: (status: VideoGenerationStatus) => void, 
    images: string[]
): Promise<{videoUrl: string, storyText: string}> => {
    try {
        // Step 1: Generate the video from images
        onProgress({ message: "Generating story video...", progress: 0 });
        const videoUrl = await generateVideoPost(prompt, onProgress, images);

        // Step 2: Generate the story text based on the prompt
        onProgress({ message: "Writing the story...", progress: 95 });
        const storyPrompt = `You are an expert marketing copywriter. Your task is to create a compelling social media pitch for a product based on a video and user input.

The user's prompt is: "${prompt}"

Your output must be a persuasive and concise social media post in the following format:

**[Catchy Headline that Grabs Attention]**

[1-2 paragraphs describing the product, its benefits, and why the customer needs it. Use a persuasive and enthusiastic tone.]

**[Clear Call to Action!]** (e.g., "Shop Now!", "Learn More!", "Get Yours Today!")

#[ProductHashtag] #[IndustryHashtag] #[BenefitHashtag]`;
        const storyText = await generateTextPost(storyPrompt);
        
        onProgress({ message: "Story generation complete!", progress: 100 });

        return { videoUrl, storyText };
    } catch (error) {
        console.error("Story generation error:", error);
        throw new Error("Failed to generate the story post.");
    }
};

export const generateVideoPost = async (prompt:string, onProgress: (status: VideoGenerationStatus) => void, images: string[] | null): Promise<string> => {
    try {
        const ai = getAiClient();
        onProgress({ message: "Initializing video generation...", progress: 0 });
        
        const generationOptions: any = {
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '9:16'
            }
        };

        if (images && images.length > 0) {
            if (images.length === 1) {
                 const { mimeType, data } = dataUrlToAiPart(images[0]);
                 generationOptions.image = {
                    imageBytes: data,
                    mimeType: mimeType
                };
            } else {
                generationOptions.model = 'veo-3.1-generate-preview'; // This model supports multiple images
                generationOptions.config.aspectRatio = '16:9'; // Required for multi-image
                generationOptions.config.resolution = '720p'; // Required for multi-image
                generationOptions.config.referenceImages = images.map(img => {
                    const { mimeType, data } = dataUrlToAiPart(img);
                    return {
                        image: {
                            imageBytes: data,
                            mimeType: mimeType
                        },
                        referenceType: 'ASSET' // Using 'ASSET' as a generic reference type
                    }
                });
            }
        }

        let operation = await ai.models.generateVideos(generationOptions);

        let messageIndex = 0;
        while (!operation.done) {
            const progress = (messageIndex / videoGenerationMessages.length) * 100;
            onProgress({ message: videoGenerationMessages[messageIndex % videoGenerationMessages.length], progress });
            messageIndex++;

            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        
        onProgress({ message: "Video generation complete!", progress: 100 });
        
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
             throw new Error("Video generation succeeded but no download link was found.");
        }

        const response = await fetch(downloadLink, {
            method: 'GET',
            headers: {
                'x-goog-api-key': process.env.API_KEY!,
            },
        });
        if (!response.ok) {
            throw new Error(`Failed to download video file: ${response.statusText}`);
        }
        const videoBlob = await response.blob();
        return URL.createObjectURL(videoBlob);
    } catch (error) {
        console.error("Video generation error:", error);
        throw error; // Re-throw to be caught by the App component
    }
};
