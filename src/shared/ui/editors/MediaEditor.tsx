import { FileX2 } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { inferContentTypeFromPath } from "@/shared/lib/fileTypes";
import { getFileName } from "@/shared/lib/utils";

interface MediaEditorProps {
  path: string;
  /** Data URL with the media bytes. */
  content: string;
  contentType?: string;
}

/**
 * Decode a base64 `data:` URL into a `blob:` object URL. Media elements
 * (`<video>`/`<audio>`) reject `data:` URLs in WebKit/Safari ("Not allowed to
 * load local resource"), and a blob also avoids holding the whole file as an
 * inflated base64 string in the element. Returns null if it isn't a data URL.
 */
function dataUrlToObjectUrl(dataUrl: string): string | null {
  const match = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(dataUrl);
  if (!match) return null;
  const [, mime, base64, data] = match;
  try {
    let bytes: Uint8Array;
    if (base64) {
      const binary = atob(data);
      bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    } else {
      bytes = new TextEncoder().encode(decodeURIComponent(data));
    }
    return URL.createObjectURL(new Blob([bytes as BlobPart], { type: mime || "application/octet-stream" }));
  } catch {
    return null;
  }
}

/**
 * Audio/video preview backed by the browser's native media elements. Formats
 * the browser cannot decode (e.g. .avi, .wmv) fall back to an explanatory
 * placeholder instead of a dead player.
 */
export const MediaEditor = memo(function MediaEditor({ path, content, contentType }: MediaEditorProps) {
  const [failed, setFailed] = useState(false);
  const type = contentType ?? inferContentTypeFromPath(path);
  const isVideo = !!type?.startsWith("video/");

  // Play from a blob: URL — Safari blocks data: URLs in media elements. Pass
  // through non-data URLs (e.g. blob:/https:) unchanged.
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    setFailed(false);
    if (!content.startsWith("data:")) {
      setSrc(content);
      return;
    }
    const url = dataUrlToObjectUrl(content);
    if (!url) {
      setFailed(true);
      return;
    }
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [content]);

  if (failed) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <FileX2 size={32} className="mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Cannot Play Media</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            The browser cannot decode this {isVideo ? "video" : "audio"} format.
          </p>
          <p className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">{type || "application/octet-stream"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-900/60 p-6 overflow-auto">
      <div className="w-full max-w-2xl text-center">
        {isVideo ? (
          // biome-ignore lint/a11y/useMediaCaption: generated/uploaded media has no caption tracks
          <video
            controls
            src={src ?? undefined}
            onError={() => setFailed(true)}
            className="w-full max-h-[70vh] rounded-md shadow-sm bg-black"
          />
        ) : (
          // biome-ignore lint/a11y/useMediaCaption: generated/uploaded media has no caption tracks
          <audio controls src={src ?? undefined} onError={() => setFailed(true)} className="w-full" />
        )}
        <p className="mt-3 text-xs text-neutral-400 dark:text-neutral-500">{getFileName(path)}</p>
      </div>
    </div>
  );
});
