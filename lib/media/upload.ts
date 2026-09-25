import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";
import { buildImageDerivatives, buildVideoPoster } from "./derivatives";

/**
 * Client-side upload orchestration.
 *
 * One logical "media item" is up to three physical objects:
 *
 *   preview   public, watermarked, downscaled  -> media_items.url
 *   thumbnail public, watermarked, small       -> media_items.thumbnailUrl
 *   original  PRIVATE, untouched HD master     -> media_items.hdObjectKey
 *
 * The original is uploaded last. If it fails, nothing is committed to the
 * database, so we never end up selling an HD file that was never stored.
 */

type UploadDestination = FunctionReturnType<
  typeof api.uploads.getUploadDestination
>;

/** What the caller must supply to mint destinations and commit rows. */
export type UploadBridge = {
  getDestination: (args: {
    fileName: string;
    contentType: string;
    mediaType: "image" | "video";
    sizeBytes?: number;
    variant?: "preview" | "original";
  }) => Promise<UploadDestination>;
};

export type PreparedMedia = {
  type: "image" | "video";
  provider: "s3" | "cloudflare";
  url: string;
  thumbnailUrl?: string;
  title: string;
  playbackId?: string;
  objectKey?: string;
  hdObjectKey?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
};

export type ProgressCallback = (fraction: number) => void;

/** Bytes over which we warn rather than silently generating a huge canvas. */
const HUGE_IMAGE_BYTES = 60 * 1024 * 1024;

export function mediaTypeOf(file: File): "image" | "video" | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return null;
}

/** Strips the extension for a sensible default title. */
function titleFromFileName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() ||
    "Untitled";
}

/**
 * POSTs a blob to a presigned S3 POST target.
 *
 * Uses XHR rather than fetch solely because fetch still cannot report upload
 * progress, and a photographer pushing a 2GB master needs a progress bar.
 */
export function postToS3(
  url: string,
  fields: Record<string, string>,
  blob: Blob,
  fileName: string,
  contentType: string,
  onProgress?: ProgressCallback,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    // Policy fields must precede the file part, per the S3 POST spec.
    for (const [key, value] of Object.entries(fields)) {
      form.append(key, value);
    }
    form.append("Content-Type", contentType);
    form.append("file", blob, fileName);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);

    if (onProgress !== undefined) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          onProgress(event.loaded / event.total);
        }
      });
    }

    xhr.addEventListener("load", () => {
      // S3 answers a successful POST with 204 (or 201 when success_action is set).
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(
          new Error(
            `Upload failed (HTTP ${xhr.status}). ${xhr.responseText.slice(0, 300)}`,
          ),
        );
      }
    });
    xhr.addEventListener("error", () =>
      reject(new Error("Upload failed: network error.")),
    );
    xhr.addEventListener("abort", () =>
      reject(new Error("Upload was cancelled.")),
    );

    xhr.send(form);
  });
}

/** POSTs a file to a Cloudflare Stream one-time direct-upload URL. */
function postToCloudflare(
  uploadUrl: string,
  file: File,
  onProgress?: ProgressCallback,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file, file.name);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl, true);

    if (onProgress !== undefined) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          onProgress(event.loaded / event.total);
        }
      });
    }

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Cloudflare upload failed (HTTP ${xhr.status}).`));
      }
    });
    xhr.addEventListener("error", () =>
      reject(new Error("Cloudflare upload failed: network error.")),
    );

    xhr.send(form);
  });
}

/**
 * Uploads one file as a preview/original pair and returns the row to commit.
 *
 * `onProgress` reports overall progress for the whole file, with the derivative
 * generation and each upload weighted roughly by cost.
 */
export async function uploadOne(
  file: File,
  bridge: UploadBridge,
  options?: { onProgress?: ProgressCallback; watermarkText?: string },
): Promise<PreparedMedia> {
  const mediaType = mediaTypeOf(file);
  if (mediaType === null) {
    throw new Error(`"${file.name}" is neither an image nor a video.`);
  }

  const report = options?.onProgress ?? (() => {});
  const title = titleFromFileName(file.name);

  if (mediaType === "image") {
    if (file.size > HUGE_IMAGE_BYTES) {
      throw new Error(
        `"${file.name}" is ${Math.round(file.size / (1024 * 1024))} MB. Please export under ${Math.round(HUGE_IMAGE_BYTES / (1024 * 1024))} MB.`,
      );
    }

    // --- 1. Derivatives (0 -> 0.2) ---------------------------------------
    const derived = await buildImageDerivatives(file, options?.watermarkText);
    report(0.2);

    // --- 2. Public preview + thumbnail (0.2 -> 0.5) ----------------------
    const previewDest = await bridge.getDestination({
      fileName: `${title}-preview.jpg`,
      contentType: "image/jpeg",
      mediaType: "image",
      sizeBytes: derived.preview.size,
      variant: "preview",
    });
    if (previewDest.provider !== "s3") {
      throw new Error("Images must be uploaded to S3.");
    }
    await postToS3(
      previewDest.url,
      previewDest.fields,
      derived.preview,
      `${title}-preview.jpg`,
      "image/jpeg",
      (f) => report(0.2 + f * 0.2),
    );

    const thumbDest = await bridge.getDestination({
      fileName: `${title}-thumb.jpg`,
      contentType: "image/jpeg",
      mediaType: "image",
      sizeBytes: derived.thumbnail.size,
      variant: "preview",
    });
    if (thumbDest.provider !== "s3") {
      throw new Error("Images must be uploaded to S3.");
    }
    await postToS3(
      thumbDest.url,
      thumbDest.fields,
      derived.thumbnail,
      `${title}-thumb.jpg`,
      "image/jpeg",
      (f) => report(0.4 + f * 0.1),
    );

    // --- 3. Private HD master (0.5 -> 1) ---------------------------------
    // Last on purpose: if this fails we throw, and the caller commits nothing.
    const originalDest = await bridge.getDestination({
      fileName: file.name,
      contentType: file.type,
      mediaType: "image",
      sizeBytes: file.size,
      variant: "original",
    });
    if (originalDest.provider !== "s3") {
      throw new Error("Originals must be uploaded to S3.");
    }
    await postToS3(
      originalDest.url,
      originalDest.fields,
      file,
      file.name,
      file.type,
      (f) => report(0.5 + f * 0.5),
    );

    report(1);

    if (previewDest.publicUrl === null || thumbDest.publicUrl === null) {
      throw new Error("Preview upload did not return a public URL.");
    }

    return {
      type: "image",
      provider: "s3",
      url: previewDest.publicUrl,
      thumbnailUrl: thumbDest.publicUrl,
      title,
      objectKey: previewDest.objectKey,
      hdObjectKey: originalDest.objectKey,
      width: derived.width,
      height: derived.height,
      sizeBytes: file.size,
    };
  }

  // --- Video ------------------------------------------------------------
  // The playable preview goes to Cloudflare Stream (watermark burned in during
  // transcode) or to S3 when Stream is not configured. Either way the HD master
  // goes to the private prefix so there is something to sell.
  const previewDest = await bridge.getDestination({
    fileName: file.name,
    contentType: file.type,
    mediaType: "video",
    sizeBytes: file.size,
    variant: "preview",
  });

  if (previewDest.provider === "cloudflare") {
    await postToCloudflare(previewDest.uploadUrl, file, (f) =>
      report(f * 0.5),
    );

    const originalDest = await bridge.getDestination({
      fileName: file.name,
      contentType: file.type,
      mediaType: "video",
      sizeBytes: file.size,
      variant: "original",
    });
    if (originalDest.provider !== "s3") {
      throw new Error("Originals must be uploaded to S3.");
    }
    await postToS3(
      originalDest.url,
      originalDest.fields,
      file,
      file.name,
      file.type,
      (f) => report(0.5 + f * 0.5),
    );
    report(1);

    return {
      type: "video",
      provider: "cloudflare",
      url: previewDest.playbackUrl,
      thumbnailUrl: previewDest.thumbnailUrl,
      title,
      playbackId: previewDest.uid,
      hdObjectKey: originalDest.objectKey,
      sizeBytes: file.size,
    };
  }

  // S3 video: the same object serves as the preview, so there is no watermark.
  // Flagged to the caller via `posterOnly` semantics in the UI copy.
  const poster = await buildVideoPoster(file, options?.watermarkText);
  await postToS3(
    previewDest.url,
    previewDest.fields,
    file,
    file.name,
    file.type,
    (f) => report(f * 0.6),
  );

  let thumbnailUrl: string | undefined;
  if (poster !== null) {
    const posterDest = await bridge.getDestination({
      fileName: `${title}-poster.jpg`,
      contentType: "image/jpeg",
      mediaType: "image",
      sizeBytes: poster.thumbnail.size,
      variant: "preview",
    });
    if (posterDest.provider === "s3") {
      await postToS3(
        posterDest.url,
        posterDest.fields,
        poster.thumbnail,
        `${title}-poster.jpg`,
        "image/jpeg",
        (f) => report(0.6 + f * 0.4),
      );
      thumbnailUrl = posterDest.publicUrl ?? undefined;
    }
  }
  report(1);

  if (previewDest.publicUrl === null) {
    throw new Error("Video upload did not return a public URL.");
  }

  return {
    type: "video",
    provider: "s3",
    url: previewDest.publicUrl,
    thumbnailUrl,
    title,
    objectKey: previewDest.objectKey,
    width: poster?.width,
    height: poster?.height,
    sizeBytes: file.size,
  };
}
