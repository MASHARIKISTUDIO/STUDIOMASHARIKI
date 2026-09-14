/**
 * Browser-side preview generation.
 *
 * Why here and not on a server: the project has no image transformation layer
 * (no Cloudinary, no Cloudflare Images, no Lambda resizer), and adding one would
 * mean new infrastructure and a per-request cost. Generating the derivative in
 * the browser at upload time means:
 *
 *   - the watermarked preview and the HD master are two distinct objects, so the
 *     master can live behind a private prefix and be unreachable by
 *     construction rather than by URL obfuscation;
 *   - there is no transform cost on the read path, which is the hot path
 *     (attendees browse far more than photographers upload);
 *   - the pipeline works with the existing presigned-POST flow untouched.
 *
 * The tradeoff, stated plainly: this is client-side, so a modified client could
 * upload an unwatermarked "preview". That is acceptable because the uploader is
 * an authenticated photographer uploading THEIR OWN work - they already possess
 * the original. It is not a defence against the uploader; it is a defence
 * against third parties scraping the public gallery. The HD paywall does not
 * depend on this code being honest, only on `hdObjectKey` staying private.
 *
 * Videos are NOT handled here - see the Cloudflare Stream watermark profile in
 * `convex/uploads.ts`. Browsers cannot reliably transcode video.
 */

/** Longest edge of a generated preview, in CSS pixels. */
const PREVIEW_MAX_EDGE = 1600;

/** JPEG quality. Low enough to deter reuse, high enough to sell from. */
const PREVIEW_QUALITY = 0.72;

/** Longest edge of the small grid thumbnail. */
const THUMBNAIL_MAX_EDGE = 640;
const THUMBNAIL_QUALITY = 0.7;

export type ImageDerivatives = {
  /** Watermarked, downscaled preview shown to attendees. */
  preview: Blob;
  /** Watermarked, small preview for grid tiles. */
  thumbnail: Blob;
  /** Intrinsic dimensions of the ORIGINAL, for CLS-free layout. */
  width: number;
  height: number;
};

/** Scales `width`x`height` to fit `maxEdge`, never upscaling. */
function fitWithin(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) {
    return { width, height };
  }
  const scale = maxEdge / longest;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

/**
 * Decodes a file into a bitmap.
 *
 * `createImageBitmap` is used in preference to an `<img>` + object URL because
 * it decodes off the main thread and does not need a DOM node, which keeps a
 * batch upload of 50 photos from janking the page.
 */
async function decode(file: Blob): Promise<ImageBitmap> {
  return await createImageBitmap(file);
}

/**
 * Paints a diagonal, tiled wordmark across the whole canvas.
 *
 * Tiled rather than a single corner mark on purpose: a corner logo is trivially
 * cropped out. Repeating it across the frame means removing it costs more effort
 * than buying the HD version, which is the actual goal.
 *
 * Kept deliberately subtle (low alpha, thin weight) so the preview still sells
 * the photograph. A heavy watermark protects the image by making nobody want it.
 */
function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string,
): void {
  // Scale with the image so the mark is proportionally identical at every size.
  const fontSize = Math.max(14, Math.round(Math.min(width, height) * 0.038));

  ctx.save();

  ctx.globalAlpha = 0.22;
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // A light-blue mark with a dark shadow stays legible over both a bright sky
  // and a dark suit, without needing to know anything about the photo.
  ctx.fillStyle = "#7dd3fc"; // sky-300, the light blue of the logo
  ctx.shadowColor = "rgba(15, 23, 42, 0.55)";
  ctx.shadowBlur = Math.round(fontSize * 0.28);

  // Rotate about the centre and over-draw past the edges so the rotated tile
  // grid still covers the corners.
  ctx.translate(width / 2, height / 2);
  ctx.rotate((-30 * Math.PI) / 180);

  const diagonal = Math.sqrt(width * width + height * height);
  const stepX = ctx.measureText(text).width + fontSize * 3.5;
  const stepY = fontSize * 6;

  for (let y = -diagonal / 2; y <= diagonal / 2; y += stepY) {
    // Offset every other row so the marks do not form vertical lanes that can
    // be cloned out in one pass.
    const rowOffset = (Math.round(y / stepY) % 2) * (stepX / 2);
    for (let x = -diagonal / 2; x <= diagonal / 2; x += stepX) {
      ctx.fillText(text, x + rowOffset, y);
    }
  }

  ctx.restore();
}

/** Renders a bitmap to a watermarked JPEG blob at the given max edge. */
async function renderVariant(
  bitmap: ImageBitmap,
  maxEdge: number,
  quality: number,
  watermarkText: string,
): Promise<Blob> {
  const { width, height } = fitWithin(bitmap.width, bitmap.height, maxEdge);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    throw new Error("Could not get a 2D canvas context.");
  }

  // JPEG has no alpha; without this, transparent PNG regions render black.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);

  drawWatermark(ctx, width, height, watermarkText);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
  if (blob === null) {
    throw new Error("Could not encode the preview image.");
  }
  return blob;
}

/**
 * Builds the watermarked preview + thumbnail pair for one image file.
 *
 * Throws if the file cannot be decoded, which the caller should surface as a
 * per-file error rather than failing the whole batch.
 */
export async function buildImageDerivatives(
  file: File,
  watermarkText = "Studio Mashariki",
): Promise<ImageDerivatives> {
  const bitmap = await decode(file);

  try {
    // Sequential, not Promise.all: two large canvases at once is how mobile
    // Safari gets itself OOM-killed mid-batch.
    const preview = await renderVariant(
      bitmap,
      PREVIEW_MAX_EDGE,
      PREVIEW_QUALITY,
      watermarkText,
    );
    const thumbnail = await renderVariant(
      bitmap,
      THUMBNAIL_MAX_EDGE,
      THUMBNAIL_QUALITY,
      watermarkText,
    );

    return {
      preview,
      thumbnail,
      width: bitmap.width,
      height: bitmap.height,
    };
  } finally {
    // Frees the decoded pixel buffer immediately instead of waiting for GC.
    bitmap.close();
  }
}

/**
 * Grabs a poster frame from a video file and watermarks it.
 *
 * Used for the S3 video path, where there is no Cloudflare Stream to generate a
 * thumbnail. Returns `null` rather than throwing when the browser cannot decode
 * the codec (AV1 and some ProRes variants), since a missing poster is a cosmetic
 * problem and must not block the upload.
 */
export async function buildVideoPoster(
  file: File,
  watermarkText = "Studio Mashariki",
): Promise<{ thumbnail: Blob; width: number; height: number } | null> {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.src = objectUrl;

  try {
    await new Promise<void>((resolve, reject) => {
      const onError = () => reject(new Error("Video metadata failed to load."));
      video.addEventListener("error", onError, { once: true });
      video.addEventListener(
        "loadeddata",
        () => {
          video.removeEventListener("error", onError);
          resolve();
        },
        { once: true },
      );
      // Some browsers will not paint frame 0, so nudge past the very start.
      video.addEventListener(
        "loadedmetadata",
        () => {
          video.currentTime = Math.min(1, (video.duration || 1) / 2);
        },
        { once: true },
      );
    });

    const canvas = document.createElement("canvas");
    const { width, height } = fitWithin(
      video.videoWidth,
      video.videoHeight,
      THUMBNAIL_MAX_EDGE,
    );
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (ctx === null) {
      return null;
    }
    ctx.drawImage(video, 0, 0, width, height);
    drawWatermark(ctx, width, height, watermarkText);

    const thumbnail = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", THUMBNAIL_QUALITY);
    });
    if (thumbnail === null) {
      return null;
    }

    return {
      thumbnail,
      width: video.videoWidth,
      height: video.videoHeight,
    };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
    video.removeAttribute("src");
  }
}
