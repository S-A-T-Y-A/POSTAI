import React, {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useUser } from "../src/contexts/UserContext";
import { PostType } from "../types";
import {
  Type,
  Image as ImageIcon,
  Film,
  Sparkles,
  UploadCloud,
  X,
  BookImage,
} from "lucide-react";

interface PostCreatorProps {
  onGenerate: (prompt: string, type: PostType, images: string[] | null) => void;
  isLoading: boolean;
  isApiKeySelectedForVideo: boolean | null;
  creditCosts: Record<PostType, number>;
}

const postTypeOptions = [
  { id: PostType.TEXT, name: "Text", icon: Type },
  { id: PostType.IMAGE, name: "Image", icon: ImageIcon },
  { id: PostType.VIDEO, name: "Video", icon: Film },
  { id: PostType.STORY, name: "Story", icon: BookImage },
];

export const PostCreator = forwardRef<any, PostCreatorProps>(
  ({ onGenerate, isLoading, isApiKeySelectedForVideo, creditCosts }, ref) => {
    const [prompt, setPrompt] = useState("");
    const [postType, setPostType] = useState<PostType>(PostType.TEXT);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { user } = useUser();

    useImperativeHandle(ref, () => ({
      setPromptAndImage: (newPrompt: string, imageUrl?: string) => {
        if (newPrompt) setPrompt(newPrompt);
        if (imageUrl) {
          setPostType(PostType.IMAGE);
          setUploadedImages([imageUrl]);
        }
      },
    }));

    const handleFiles = async (files: FileList) => {
      const fileArray = Array.from(files);
      setIsUploadingImage(true);

      const newUrls: string[] = [];
      for (const file of fileArray) {
        if (file && file.type.startsWith("image/")) {
          try {
            const gcpUrl = await uploadFileToGCP({
              file,
              userId: user?.id || "anonymous",
              type: postType === PostType.STORY ? "story" : "image",
            });
            newUrls.push(gcpUrl);
          } catch (err) {
            console.error("Failed to upload file to GCP", file.name, err);
            alert(`Failed to upload ${file.name}. Please try again.`);
          }
        } else {
          console.warn("Skipping invalid file:", file?.name);
          alert(`Skipping invalid file: ${file.name}`);
        }
      }

      if (newUrls.length > 0) {
        setUploadedImages((prev) => [...prev, ...newUrls]);
      }
      setIsUploadingImage(false);
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
      e.stopPropagation();
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
      const imagesToSend = uploadedImages;
      if (prompt.trim() || imagesToSend.length > 0) {
        await onGenerate(prompt, postType, imagesToSend);
        if (!isLoading) {
          setPrompt("");
          setUploadedImages([]);
        }
      }
    };

    const isGenerateDisabled =
      isLoading ||
      isUploadingImage ||
      (!prompt.trim() && uploadedImages.length === 0) ||
      ((postType === PostType.VIDEO || postType === PostType.STORY) &&
        !isApiKeySelectedForVideo) ||
      (postType === PostType.STORY && uploadedImages.length === 0);

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          className={`relative grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 p-4 border-2 border-dashed rounded-lg transition-colors duration-200 ease-in-out
                      ${isDragging ? "border-brand-primary bg-brand-primary/10" : "border-brand-border hover:border-brand-primary/50"}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {uploadedImages.length === 0 && !isDragging && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-brand-text-secondary pointer-events-none">
              <UploadCloud size={32} className="mb-2 opacity-50" />
              <p className="text-sm font-medium">Drag & drop images here</p>
              <p className="text-xs opacity-60">or click to upload</p>
            </div>
          )}

          {uploadedImages.map((image, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={image}
                alt={`Upload preview ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border-2 border-brand-border"
              />
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

          {/* Constant Upload Button */}
          <div
            className={`relative flex flex-col items-center justify-center aspect-square border-2 border-dashed border-brand-border hover:border-brand-primary/50 rounded-lg cursor-pointer transition-colors duration-200 ease-in-out text-brand-text-secondary
                        ${uploadedImages.length === 0 ? "opacity-0" : "opacity-100"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud
              size={24}
            />
            <span className="text-[10px] mt-1 font-medium">Add Image</span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange}
            />
          </div>

          {/* Hidden input for the base grid click */}
          {uploadedImages.length === 0 && (
            <div
              className="absolute inset-0 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            />
          )}
        </div>

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
                  className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 text-center ${isSelected
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
          {isLoading ? "Generating..." : isUploadingImage ? "Uploading..." : "Generate Post"}
        </button>
      </form>
    );
  },
);

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
