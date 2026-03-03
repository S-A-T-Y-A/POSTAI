import React, {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useContext,
} from "react";
import { useUser } from "../src/contexts/UserContext";
import { PostType } from "../types";
import {
  Type,
  Image,
  Film,
  Sparkles,
  UploadCloud,
  X,
  BookImage,
} from "lucide-react";

// Remove: import { uploadFileToGCP } from "../services/gcpStorageService";

interface PostCreatorProps {
  onGenerate: (prompt: string, type: PostType, images: string[] | null) => void;
  isLoading: boolean;
  isApiKeySelectedForVideo: boolean | null;
  creditCosts: Record<PostType, number>;
}

const postTypeOptions = [
  { id: PostType.TEXT, name: "Text", icon: Type },
  { id: PostType.IMAGE, name: "Image", icon: Image },
  { id: PostType.VIDEO, name: "Video", icon: Film },
  { id: PostType.STORY, name: "Story", icon: BookImage },
];

export const PostCreator = forwardRef<any, PostCreatorProps>(
  ({ onGenerate, isLoading, isApiKeySelectedForVideo, creditCosts }, ref) => {
    const [prompt, setPrompt] = useState("");
    const [postType, setPostType] = useState<PostType>(PostType.TEXT);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      setPromptAndImage: (newPrompt: string, imageUrl: string) => {
        setPrompt(newPrompt);
        setPostType(PostType.IMAGE);
        setUploadedImages([imageUrl]);
      },
    }));

    const { user } = useUser();

    // For story prompt input images, do NOT upload to GCP, just keep as local object URLs or base64
    const handleFiles = async (files: FileList) => {
      const fileArray = Array.from(files);
      const localUrls: string[] = [];
      for (const file of fileArray) {
        if (
          file &&
          (file.type.startsWith("image/") ||
            file.type.startsWith("video/") ||
            file.type.startsWith("audio/") ||
            file.type === "application/json")
        ) {
          try {
            // Use local object URL for preview and pass file object/base64 to story generator
            const url = URL.createObjectURL(file);
            localUrls.push(url);
          } catch (err) {
            console.error(
              "Failed to process file for prompt input",
              file.name,
              err,
            );
            alert(`Failed to process file: ${file.name}`);
          }
        } else {
          console.warn("Skipping invalid file:", file?.name);
          alert(`Skipping invalid file: ${file.name}`);
        }
      }
      if (localUrls.length === fileArray.length) {
        setUploadedImages((prev) => [...prev, ...localUrls]);
      }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation(); // Necessary to allow drop
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      // For story posts, send all uploadedImages (local object URLs or base64)
      const imagesToSend =
        postType === PostType.STORY
          ? uploadedImages
          : uploadedImages.filter((img) =>
              img.startsWith("https://drive.google.com/uc?id="),
            );
      if (prompt.trim() || imagesToSend.length > 0) {
        await onGenerate(prompt, postType, imagesToSend);
        // Only clear after generation is done and not loading
        if (!isLoading) {
          setPrompt("");
          setUploadedImages([]);
        }
      }
    };

    const isGenerateDisabled =
      isLoading ||
      (!prompt.trim() && uploadedImages.length === 0) ||
      ((postType === PostType.VIDEO || postType === PostType.STORY) &&
        !isApiKeySelectedForVideo) ||
      (postType === PostType.STORY && uploadedImages.length === 0);

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {uploadedImages.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {uploadedImages.map((image, index) => (
              <div key={index} className="relative group aspect-square">
                {image ? (
                  <img
                    src={image}
                    alt={`Upload preview ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : null}
                <button
                  type="button"
                  onClick={() =>
                    setUploadedImages((prev) =>
                      prev.filter((_, i) => i !== index),
                    )
                  }
                  className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div
            className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ease-in-out
                        ${isDragging ? "border-brand-primary bg-brand-primary/10" : "border-brand-border hover:border-brand-primary/50"}`}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-brand-text-secondary">
              <UploadCloud
                size={40}
                className={`mb-3 transition-colors ${isDragging ? "text-brand-primary" : ""}`}
              />
              <p className="mb-2 text-sm">
                <span className="font-semibold text-brand-text">
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <p className="text-xs">PNG, JPG, or WEBP</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange}
            />
          </div>
        )}

        <div>
          <label
            htmlFor="prompt"
            className="block text-sm font-medium text-brand-text-secondary mb-2"
          >
            {uploadedImages.length > 0
              ? "Describe the story you want to create..."
              : "What's on your mind?"}
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A futuristic city skyline at sunset, cyberpunk style..."
            className="w-full h-32 p-3 bg-brand-bg border-2 border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all duration-200 resize-none text-brand-text placeholder:text-brand-text-secondary"
            disabled={isLoading}
          />
        </div>

        <div>
          <span className="block text-sm font-medium text-brand-text-secondary mb-2">
            Choose post type
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {postTypeOptions.map((option) => {
              const isSelected = postType === option.id;
              const isDisabled =
                isLoading ||
                ((option.id === PostType.VIDEO ||
                  option.id === PostType.STORY) &&
                  !isApiKeySelectedForVideo);
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPostType(option.id)}
                  disabled={isDisabled}
                  className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 text-center ${
                    isSelected
                      ? "bg-gradient-to-r from-brand-secondary/20 to-brand-primary/20 border-brand-primary text-brand-text"
                      : "bg-brand-bg border-brand-border hover:border-brand-text-secondary text-brand-text-secondary hover:text-brand-text"
                  } ${isDisabled ? "opacity-50 cursor-not-allowed scale-100" : ""}`}
                >
                  <Icon className="h-6 w-6 mb-2" />
                  <span className="text-sm font-semibold">{option.name}</span>
                  <span className="text-xs text-brand-text-secondary">
                    {creditCosts[option.id]} credits
                  </span>
                </button>
              );
            })}
          </div>
          {(postType === PostType.VIDEO || postType === PostType.STORY) &&
            !isApiKeySelectedForVideo && (
              <p className="text-xs text-yellow-400/80 mt-2">
                A Google AI Studio API key is required for this feature. The key
                selection dialog will appear at the bottom of the page.
              </p>
            )}
          {postType === PostType.STORY && uploadedImages.length === 0 && (
            <p className="text-xs text-brand-primary mt-2 flex items-center">
              <BookImage className="h-3 w-3 mr-1" />
              Please upload at least one image to create a narrative story.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isGenerateDisabled}
          className="w-full flex items-center justify-center py-3 px-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform hover:shadow-lg hover:shadow-brand-primary/20 hover:-translate-y-1"
        >
          <Sparkles className="h-5 w-5 mr-2" />
          {isLoading ? "Generating..." : "Generate Post"}
        </button>
      </form>
    );
  },
);

// Remove: import { uploadFileToGoogleDrive } from "../services/googleDriveUpload";

// Add helper to upload any file to GCP via backend
async function uploadFileToGCP({
  file,
  userId,
  type,
  metadata,
}: {
  file: File;
  userId: string;
  type: string;
  metadata?: any;
}): Promise<string> {
  // Convert file to base64
  const fileBuffer = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const res = await fetch("/api/media/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      fileName: file.name,
      mimeType: file.type,
      type,
      metadata,
      fileBuffer,
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Upload failed");
  return data.media.url;
}
