
import { GoogleGenAI } from "@google/genai";

import { VideoGenerationStatus } from "../types.js";

const getAiClient = () => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable not set on server");
    }
    // Create a new instance for each call to ensure the latest API key is used, especially for Veo.
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

async function imageToAiPart(imageSource: string): Promise<{ mimeType: string; data: string }> {
    if (imageSource.startsWith('data:')) {
        const parts = imageSource.split(',');
        const mimeType = parts[0].split(':')[1].split(';')[0];
        const data = parts[1];
        return { mimeType, data };
    } else if (imageSource.startsWith('http')) {
        const response = await fetch(imageSource);
        if (!response.ok) {
            throw new Error(`Failed to fetch image from URL: ${imageSource}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const mimeType = response.headers.get('content-type') || 'image/png';
        const data = Buffer.from(arrayBuffer).toString('base64');
        return { mimeType, data };
    }
    throw new Error(`Unsupported image source format: ${imageSource.substring(0, 20)}...`);
}


export const generateTextPost = async (prompt: string, images?: string[] | null): Promise<string> => {
    try {
        const ai = getAiClient();

        const contentParts: any[] = [];
        if (images && images.length > 0) {
            for (const img of images) {
                contentParts.push({ inlineData: await imageToAiPart(img) });
            }
        }
        contentParts.push({ text: prompt || "Describe this image." });

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: contentParts },
        });

        const text = response?.text;
        if (!text) {
            throw new Error("No text content generated.");
        }
        return text;
    } catch (error) {
        console.error("Text generation error:", error);
        throw new Error("Failed to generate text post.");
    }

    // const dummytext = "**Superman** is one of the most iconic and influential characters in pop culture. Created by writer **Jerry Siegel** and artist **Joe Shuster**, he first appeared in *Action Comics #1* in **1938**, marking the birth of the modern superhero.\n\nHere is a breakdown of everything you need to know about the Man of Steel:\n\n### 1. Origin Story\n*   **Birth Name:** Kal-El\n*   **Home Planet:** Krypton\n*   **Parents:** Jor-El and Lara (Kryptonian parents); Jonathan and Martha Kent (Earth adoptive parents).\n*   **The Story:** To save him from the destruction of Krypton, Kal-El’s parents sent him to Earth in a small spacecraft. He landed in Smallville, Kansas, where he was found and raised by the Kents, who taught him strong moral values.\n\n### 2. Secret Identity\n*   **Human Name:** Clark Kent\n*   **Profession:** Investigative Reporter for the *Daily Planet* in the city of **Metropolis**.\n*   **Purpose:** Clark uses his identity as a \"mild-mannered reporter\" to stay informed about world events and to live a normal life among humans.\n\n### 3. Powers and Abilities\nSuperman’s cells act as a living solar battery, fueled by Earth’s **yellow sun**. His powers include:\n*   **Super Strength:** Capable of moving planets and punching through dimensions.\n*   **Flight:** The ability to defy gravity.\n*   **Invulnerability:** Nearly indestructible; bullets bounce off him.\n*   **Super Speed:** Can move faster than the speed of light.\n*   **Heat Vision:** Can emit beams of intense heat from his eyes.\n*   **Freeze Breath:** Can freeze objects or create hurricane-force winds.\n*   **X-Ray Vision:** Can see through anything (except lead).\n\n### 4. Weaknesses\nDespite his power, Superman has specific vulnerabilities:\n*   **Kryptonite:** Radioactive fragments of his home planet. Green Kryptonite is the most common, causing physical pain and stripping him of his powers.\n*   **Magic:** He has no special defense against mystical or supernatural attacks.\n*   **Red Solar Radiation:** Under a red sun (like Krypton's), he loses his powers and becomes a normal human.\n*   **His Morality:** His refusal to kill and his desire to protect everyone is often used against him by villains.\n\n### 5. Supporting Characters\n*   **Lois Lane:** The love of his life and a brilliant journalist.\n*   **Lex Luthor:** His arch-nemesis, a billionaire genius who views Superman as a threat to human potential.\n*   **Jimmy Olsen:** A young photographer and Superman’s \"best pal.\"\n*   **The Justice League:** Superman is a founding member and often the leader of this premier superhero team (alongside Batman and Wonder Woman).\n\n### 6. Famous Symbols\n*   **The \"S\" Shield:** While it looks like an \"S\" for Superman, in Kryptonian lore, it is the House of El family crest and the symbol for **Hope**.\n*   **The Cape:** His classic red, blue, and yellow suit is instantly recognizable worldwide.\n\n### 7. Cultural Impact\nSuperman is often called \"The Big Blue Boy Scout\" because he represents \"Truth, Justice, and a Better Tomorrow.\" He set the template for almost every superhero that followed, including the concept of a secret identity, a costume, and a set of extraordinary powers used for the public good.\n\n**Are you looking for information on a specific Superman movie, comic book era, or actor?**"
    // return dummytext;
};

export const generateImagePost = async (prompt: string, images?: string[] | null): Promise<string> => {
    try {
        const ai = getAiClient();

        const contentParts: any[] = [];
        if (images && images.length > 0) {
            for (const img of images) {
                contentParts.push({ inlineData: await imageToAiPart(img) });
            }
        }
        let finalPrompt = prompt;
        if (images && images.length > 1) {
            finalPrompt = `COMBINE AND MERGE ALL PEOPLE from the provided reference images into a single cohesive scene. 
            Ensure every distinct person from the references appears together in the final image. 
            Maintain their individual identities, faces, and clothing styles. 
            Scene: ${prompt}`;
        }
        contentParts.push({ text: finalPrompt });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: contentParts },
        });

        const candidates = response?.candidates;
        if (!candidates || candidates.length === 0) {
            throw new Error("No candidates returned from Gemini.");
        }
        const parts = candidates[0]?.content?.parts || [];
        for (const part of parts) {
            if (part.inlineData) {
                const mimeType = part.inlineData.mimeType ?? "image/png";
                const base64EncodeString = part.inlineData.data ?? "";
                if (typeof mimeType === "string" && typeof base64EncodeString === "string" && base64EncodeString.length > 0) {
                    return `data:${mimeType};base64,${base64EncodeString}`;
                }
            }
        }
        throw new Error("No image content generated.");
    } catch (error) {
        console.error("Image generation error:", error);
        throw new Error("Failed to generate image post.");
    }
    // Dummy image (transparent PNG for testing)
    // return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWCAYAAADnY5yFAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5QwFChQwQw1QJwAAAB1pVFh0Q29tbWVudAAAAAAAvK6ymQAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4xMfEgaZUAAABGSURBVHja7cEBDQAAAMKg909tDjegAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwG4AAGwABJwAAZQAAAABJRU5ErkJggg==";
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
): Promise<{ videoUrl: string, storyText: string }> => {
    try {
        // Step 1: Generate the video from images
        onProgress({ message: "Generating story video...", progress: 0 });
        const videoUrl = await generateVideoPost(prompt, onProgress, images);

        // Step 2: Generate the story text based on the prompt
        onProgress({ message: "Writing the story...", progress: 95 });
        const storyPrompt = `You are an expert marketing copywriter. Your task is to create a compelling social media pitch for a product based on a video and user input.

    The user's prompt is: "${prompt}"

    **REFERENCE IMAGES:** You will be provided with images that serve as direct visual references for the characters in the video.

    **CRITICAL:** 
    1. The video generated for this post is limited to **8 seconds**. Your pitch must be highly engaging, high-impact, and designed to complete its message within that 8-second window.
    2. You MUST maintain the physical likeness and identity of the people shown in the reference images. Refer to them as they appear (e.g., if there's a couple, talk about their specific chemistry or the moment they are sharing based on the images).

    Your output must be a persuasive and concise social media post in the following format:

    **[Catchy Headline that Grabs Attention]**

    [1-2 paragraphs describing the product, its benefits, and why the customer needs it. Use a persuasive and enthusiastic tone.]

    **[Clear Call to Action!]** (e.g., "Shop Now!", "Learn More!", "Get Yours Today!")

    #[ProductHashtag] #[IndustryHashtag] #[BenefitHashtag]`;
        const storyText = await generateTextPost(storyPrompt, images);

        onProgress({ message: "Story generation complete!", progress: 100 });

        return { videoUrl, storyText };
    } catch (error) {
        console.error("Story generation error:", error);
        throw new Error("Failed to generate the story post.");
    }
    // onProgress({ message: "Returning dummy video for testing...", progress: 100 });
    // Dummy video (short sample MP4)
    // return { videoUrl: "https://storage.googleapis.com/postai_media/Videos/dogdummy.mp4", storyText: "**Superman** is one of the most iconic and influential characters in pop culture. Created by writer **Jerry Siegel** and artist **Joe Shuster**, he first appeared in *Action Comics #1* in **1938**, marking the birth of the modern superhero." };
};

export const generateVideoPost = async (prompt: string, onProgress: (status: VideoGenerationStatus) => void, images: string[] | null): Promise<string> => {
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
                const { mimeType, data } = await imageToAiPart(images[0]);
                generationOptions.image = {
                    imageBytes: data,
                    mimeType: mimeType
                };
            } else {
                generationOptions.model = 'veo-3.1-generate-preview'; // This model supports multiple images
                generationOptions.config.aspectRatio = '16:9'; // Required for multi-image
                generationOptions.config.resolution = '720p'; // Required for multi-image

                const referenceImages = [];
                for (const img of images) {
                    const { mimeType, data } = await imageToAiPart(img);
                    referenceImages.push({
                        image: {
                            imageBytes: data,
                            mimeType: mimeType
                        },
                        referenceType: 'CHARACTER'
                    });
                }
                generationOptions.config.referenceImages = referenceImages;
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

        console.log("Video Generation Operation Result:", JSON.stringify(operation, null, 2));

        if (operation.error) {
            console.error("Gemini Video Operation Error:", operation.error);
            throw new Error(`Gemini Video generation failed: ${operation.error.message || "Unknown error"}`);
        }

        let downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

        // Sometimes the link takes a moment to propagate even after .done is true
        if (!downloadLink) {
            console.log("No download link found immediately. Waiting 3 seconds for link propagation...");
            await new Promise(resolve => setTimeout(resolve, 3000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
            downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        }

        if (!downloadLink) {
            console.error("Gemini Response Structure:", JSON.stringify(operation.response, null, 2));
            throw new Error("Video generation succeeded but no download link was found after retry. Check server logs for response structure.");
        }

        const response = await fetch(downloadLink, {
            method: 'GET',
            headers: {
                'x-goog-api-key': process.env.GEMINI_API_KEY!,
            },
        });
        if (!response.ok) {
            throw new Error(`Failed to download video file: ${response.statusText}`);
        }
        const videoArrayBuffer = await response.arrayBuffer();
        const base64Video = Buffer.from(videoArrayBuffer).toString('base64');
        return `data:video/mp4;base64,${base64Video}`;
    } catch (error) {
        console.error("Video generation error:", error);
        throw error; // Re-throw to be caught by the App component
    }

    // onProgress({ message: "Returning dummy video for testing...", progress: 100 });
    // Dummy video (short sample MP4)
    // return "https://storage.googleapis.com/postai_media/Videos/dogdummy.mp4";
};
