"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { convex } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { api } from "@/convex/_generated/api";
import { postToS3 } from "@/lib/media/upload";

const MAX_BYTES = 80 * 1024 * 1024;
const ACCEPT = "video/mp4,video/webm";

type PageKey = "home" | "gallery";

export function HeroVideosForm() {
  if (!convex) {
    return (
      <p className="text-sm text-gray-400">
        Convex is not configured, so hero videos cannot be saved.
      </p>
    );
  }
  return <HeroVideosConnected />;
}

function HeroVideosConnected() {
  const heroes = useQuery(api.site.getHeroVideos);
  const setHeroVideo = useMutation(api.site.setHeroVideo);
  const getUploadDestination = useAction(api.uploads.getUploadDestination);

  async function saveUrl(page: PageKey, videoUrl: string | null) {
    await setHeroVideo({ page, videoUrl });
  }

  async function upload(page: PageKey, file: File, onProgress: (fraction: number) => void) {
    if (file.type !== "video/mp4" && file.type !== "video/webm") {
      throw new Error("Upload an MP4 or WebM file.");
    }
    if (file.size > MAX_BYTES) {
      throw new Error("Hero videos must be 80 MB or smaller.");
    }
    const destination = await getUploadDestination({
      fileName: file.name,
      contentType: file.type,
      mediaType: "video",
      sizeBytes: file.size,
      variant: "preview",
      purpose: "hero",
    });
    if (destination.provider !== "s3" || destination.publicUrl === null) {
      throw new Error("Hero upload did not return a public file URL.");
    }
    await postToS3(
      destination.url,
      destination.fields,
      file,
      file.name,
      file.type,
      onProgress,
    );
    await setHeroVideo({ page, videoUrl: destination.publicUrl });
  }

  return (
    <div className="grid gap-6">
      <HeroPanel
        title="Homepage"
        description="Plays behind the main page hero. MP4 or WebM, up to 80 MB, looping and muted."
        videoUrl={heroes?.homeVideoUrl ?? null}
        loading={heroes === undefined}
        onSave={(url) => saveUrl("home", url)}
        onUpload={(file, onProgress) => upload("home", file, onProgress)}
      />
      <HeroPanel
        title="Gallery"
        description="Plays behind the gallery page hero. Same file rules as the homepage."
        videoUrl={heroes?.galleryVideoUrl ?? null}
        loading={heroes === undefined}
        onSave={(url) => saveUrl("gallery", url)}
        onUpload={(file, onProgress) => upload("gallery", file, onProgress)}
      />
    </div>
  );
}

function HeroPanel({
  title,
  description,
  videoUrl,
  loading,
  onSave,
  onUpload,
}: {
  title: string;
  description: string;
  videoUrl: string | null;
  loading: boolean;
  onSave: (videoUrl: string | null) => Promise<void>;
  onUpload: (file: File, onProgress: (fraction: number) => void) => Promise<void>;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const url = draft ?? videoUrl ?? "";

  async function saveUrl(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await onSave(url.trim() === "" ? null : url.trim());
      setDraft(null);
      toast.success(`${title} hero video saved.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save that video.");
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File | undefined) {
    if (file === undefined) {
      return;
    }
    setBusy(true);
    setProgress(0);
    try {
      await onUpload(file, (fraction) => setProgress(Math.round(fraction * 100)));
      setDraft(null);
      toast.success(`${title} hero video uploaded.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await onSave(null);
      setDraft("");
      toast.success(`${title} hero video removed.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove that video.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-white/10 bg-gray-900/50 p-4 sm:p-5">
      <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-400">
        {title}
      </h2>
      <p className="mt-1 max-w-xl text-sm text-gray-400">{description}</p>

      {videoUrl ? (
        <video
          src={videoUrl}
          muted
          loop
          playsInline
          controls
          className="mt-4 aspect-video w-full max-w-md rounded-lg bg-black object-cover"
        />
      ) : (
        <p className="mt-4 text-sm text-gray-500">
          {loading ? "Loading…" : "No video set. The hero uses the gradient background."}
        </p>
      )}

      <form onSubmit={(event) => void saveUrl(event)} className="mt-4 grid gap-3">
        <div>
          <Label htmlFor={`${title}-url`}>Video URL</Label>
          <Input
            id={`${title}-url`}
            type="url"
            inputMode="url"
            placeholder="https://…/hero.mp4"
            value={url}
            disabled={busy}
            onChange={(event) => setDraft(event.target.value)}
            className="mt-1.5"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy}>
            Save URL
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy || !videoUrl}
            onClick={() => void remove()}
          >
            Remove
          </Button>
        </div>
      </form>

      <div className="mt-4">
        <Label htmlFor={`${title}-file`}>Or upload a file</Label>
        <Input
          id={`${title}-file`}
          type="file"
          accept={ACCEPT}
          disabled={busy}
          className="mt-1.5"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            void onFile(file);
          }}
        />
        {progress !== null ? (
          <Progress value={progress} className="mt-3" />
        ) : null}
      </div>
    </section>
  );
}
