"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { ImagePlus, X, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useImageUpload } from "@/hooks/useImageUpload";

type UploadEndpoint = "article-cover" | "avatar";

interface ImageUploadProps {
  endpoint: UploadEndpoint;
  value?: string | null;
  onChange: (url: string | null) => void;
  aspectRatio?: "video" | "square" | "wide";
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

const aspectRatioMap = {
  video: "aspect-[16/9]",
  square: "aspect-square",
  wide: "aspect-[21/9]",
};

export function ImageUpload({
  endpoint,
  value,
  onChange,
  aspectRatio = "video",
  className,
  disabled = false,
  placeholder = "Click or drag an image here to upload",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { upload, uploading, progress } = useImageUpload({
    endpoint,
    onSuccess: (url) => onChange(url),
  });

  const handleFile = useCallback(
    async (file: File) => {
      if (disabled || uploading) return;
      await upload(file);
    },
    [disabled, uploading, upload],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so re-selecting the same file fires onChange
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const handleClick = () => {
    if (!disabled && !uploading && !value) {
      inputRef.current?.click();
    }
  };

  if (value) {
    return (
      <div
        className={cn(
          "relative rounded-md overflow-hidden group",
          aspectRatioMap[aspectRatio],
          className,
        )}
      >
        <Image
          src={value}
          alt="Uploaded image"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 800px"
          unoptimized={value.startsWith("data:")}
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
            className="bg-white/90 hover:bg-white text-ink-900 rounded-md px-3 py-1.5 text-caption font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            Replace
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="bg-destructive/90 hover:bg-destructive text-white rounded-md px-3 py-1.5 text-caption font-semibold flex items-center gap-1.5 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Remove
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleInputChange}
          className="sr-only"
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        "relative rounded-md border-2 border-dashed transition-all cursor-pointer",
        aspectRatioMap[aspectRatio],
        isDragging
          ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20"
          : "border-border hover:border-amber-400 bg-muted/20 hover:bg-muted/30",
        (disabled || uploading) && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleInputChange}
        className="sr-only"
        disabled={disabled || uploading}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
        {uploading ? (
          <>
            <div className="relative">
              <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
            </div>
            <div className="w-full max-w-[160px] space-y-1.5">
              <div className="h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-caption text-muted-foreground text-center">
                Uploading… {progress}%
              </p>
            </div>
          </>
        ) : (
          <>
            <div
              className={cn(
                "rounded-full p-3 transition-colors",
                isDragging ? "bg-amber-100 dark:bg-amber-950/40" : "bg-muted",
              )}
            >
              <ImagePlus
                className={cn(
                  "h-6 w-6 transition-colors",
                  isDragging ? "text-amber-600" : "text-muted-foreground",
                )}
              />
            </div>
            <div className="text-center">
              <p className="text-body-sm font-medium text-foreground">
                {isDragging ? "Drop image here" : placeholder}
              </p>
              <p className="text-caption text-muted-foreground mt-0.5">
                JPG, PNG, WebP or GIF · Max 10 MB
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
