import { useCallback, useState } from "react";
import { inferContentTypeFromPath } from "@/shared/lib/fileTypes";
import { readAsDataURL, resizeImageBlob } from "@/shared/lib/utils";
import type { Content, ImageContent } from "@/shared/types/chat";

interface UseFileAttachmentsOptions {
  visionFiles: string[];
  artifactsAvailable: boolean;
}

/**
 * Accept-attribute for the chat file picker, kept in sync with `handleFiles`'
 * intake rule (single source of truth): vision images always; any file when the
 * artifacts workspace is available to hold it ("" = browser shows all files,
 * matching the artifacts drawer). Without artifacts, only vision images.
 */
export function chatAcceptString(visionFiles: string[], artifactsAvailable: boolean): string {
  return artifactsAvailable ? "" : visionFiles.join(",");
}

export interface UseFileAttachmentsReturn {
  attachments: Content[];
  pendingFiles: File[];
  extractingAttachments: Set<string>;
  setExtractingAttachments: React.Dispatch<React.SetStateAction<Set<string>>>;
  setPendingFiles: React.Dispatch<React.SetStateAction<File[]>>;
  handleFiles: (files: File[]) => Promise<void>;
  clearAttachments: () => void;
  removeAttachment: (index: number) => void;
}

export function useFileAttachments({
  visionFiles,
  artifactsAvailable,
}: UseFileAttachmentsOptions): UseFileAttachmentsReturn {
  const [attachments, setAttachments] = useState<Content[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [extractingAttachments, setExtractingAttachments] = useState<Set<string>>(new Set());

  const handleFiles = useCallback(
    async (files: File[]) => {
      // Normalize MIME types up front (browsers sometimes omit/guess them), then
      // split into vision images (sent inline) and documents (→ artifacts).
      const imageFiles: File[] = [];
      const docFiles: File[] = [];
      for (const file of files) {
        const effectiveType =
          file.type && file.type !== "application/octet-stream"
            ? file.type
            : (inferContentTypeFromPath(file.name) ?? file.type);
        const effectiveFile = effectiveType !== file.type ? new File([file], file.name, { type: effectiveType }) : file;

        // Vision images are sent inline; any other file goes to the artifacts
        // workspace when available (matches the artifacts drawer). Without
        // artifacts there's nowhere to put non-image files, so they're dropped.
        if (visionFiles.includes(effectiveType)) imageFiles.push(effectiveFile);
        else if (artifactsAvailable) docFiles.push(effectiveFile);
      }

      // Documents: hold them pending until send. The actual write into the
      // workspace happens at send time — nothing is persisted if the attachment
      // is removed or never sent. Artifacts is always active when available, so
      // the model already has the tools.
      if (docFiles.length > 0) {
        setPendingFiles((prev) => [...prev, ...docFiles]);
      }

      // Images: resize/encode now (async) — shown via the extracting spinner.
      if (imageFiles.length > 0) {
        const ids = imageFiles.map((file, index) => `${file.name}-${index}`);
        setExtractingAttachments((prev) => new Set([...prev, ...ids]));

        const settled = await Promise.allSettled(
          imageFiles.map(async (file) => {
            const blob = await resizeImageBlob(file, 1920, 1920);
            const dataUrl = await readAsDataURL(blob);
            return { type: "image", name: file.name, data: dataUrl } as ImageContent;
          }),
        );

        const valid = settled
          .filter((r): r is PromiseFulfilledResult<ImageContent> => r.status === "fulfilled")
          .map((r) => r.value);

        setAttachments((prev) => [...prev, ...valid]);
        setExtractingAttachments((prev) => {
          const next = new Set(prev);
          for (const id of ids) next.delete(id);
          return next;
        });
      }
    },
    [visionFiles, artifactsAvailable],
  );

  const clearAttachments = useCallback(() => {
    setAttachments([]);
    setPendingFiles([]);
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return {
    attachments,
    pendingFiles,
    extractingAttachments,
    setExtractingAttachments,
    setPendingFiles,
    handleFiles,
    clearAttachments,
    removeAttachment,
  };
}
