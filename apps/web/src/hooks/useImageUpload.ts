'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

type UploadEndpoint = 'article-cover' | 'avatar';

interface UseImageUploadOptions {
  endpoint: UploadEndpoint;
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

interface UseImageUploadReturn {
  upload: (file: File) => Promise<string | null>;
  uploading: boolean;
  progress: number;
}

function getAuthToken(): string {
  return (
    document.cookie
      .split('; ')
      .find((row) => row.startsWith('access_token='))
      ?.split('=')[1] ?? ''
  );
}

export function useImageUpload({
  endpoint,
  onSuccess,
  onError,
}: UseImageUploadOptions): UseImageUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(
    async (file: File): Promise<string | null> => {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        const err = new Error('Only JPG, PNG, WebP, and GIF images are allowed');
        toast.error(err.message);
        onError?.(err);
        return null;
      }

      // Validate file size (10 MB max)
      const maxBytes = 10 * 1024 * 1024;
      if (file.size > maxBytes) {
        const err = new Error('Image must be under 10 MB');
        toast.error(err.message);
        onError?.(err);
        return null;
      }

      setUploading(true);
      setProgress(0);

      try {
        // Convert to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result); // full data URI: "data:image/jpeg;base64,..."
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
          // Simulate progress during file read
          reader.onprogress = (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 50));
            }
          };
        });

        setProgress(60);

        const token = getAuthToken();
        const response = await fetch(`${API_URL}/upload/${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            image: base64,
            fileName: file.name.split('.')[0], // strip extension
          }),
        });

        setProgress(90);

        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as {
            error?: { message?: string };
          };
          throw new Error(
            body.error?.message ?? `Upload failed with status ${response.status}`
          );
        }

        const data = (await response.json()) as { url: string; publicId: string };
        setProgress(100);
        onSuccess?.(data.url);
        return data.url;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Upload failed');
        toast.error(error.message);
        onError?.(error);
        return null;
      } finally {
        setUploading(false);
        // Reset progress after a short delay so the UI can show 100%
        setTimeout(() => setProgress(0), 600);
      }
    },
    [endpoint, onSuccess, onError]
  );

  return { upload, uploading, progress };
}