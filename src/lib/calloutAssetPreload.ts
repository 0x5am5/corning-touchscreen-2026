type CalloutAssetStatus = "idle" | "loading" | "ready" | "error";

interface CalloutAssetCacheEntry {
  promise: Promise<CalloutAssetStatus> | null;
  status: CalloutAssetStatus;
}

const IMAGE_ASSET_PATTERN = /\.(apng|avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i;
const VIDEO_ASSET_PATTERN = /\.(m4v|mov|mp4|ogv|webm)(?:[?#].*)?$/i;

const calloutAssetCache = new Map<string, CalloutAssetCacheEntry>();

function getCacheEntry(src: string) {
  const existingEntry = calloutAssetCache.get(src);

  if (existingEntry) {
    return existingEntry;
  }

  const nextEntry: CalloutAssetCacheEntry = {
    promise: null,
    status: "idle",
  };

  calloutAssetCache.set(src, nextEntry);
  return nextEntry;
}

function preloadImage(src: string) {
  const image = new Image();
  image.decoding = "async";
  image.src = src;

  if (image.complete && image.naturalWidth > 0) {
    if (typeof image.decode === "function") {
      return image.decode().catch(() => undefined);
    }

    return Promise.resolve();
  }

  if (typeof image.decode === "function") {
    return image.decode();
  }

  return new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Failed to preload callout asset: ${src}`));
  });
}

function preloadVideo(src: string) {
  return new Promise<void>((resolve, reject) => {
    const video = document.createElement("video");

    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = src;

    const finalize = () => {
      video.removeEventListener("loadeddata", handleReady);
      video.removeEventListener("error", handleError);
    };

    const handleReady = () => {
      finalize();
      resolve();
    };

    const handleError = () => {
      finalize();
      reject(new Error(`Failed to preload callout asset: ${src}`));
    };

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      resolve();
      return;
    }

    video.addEventListener("loadeddata", handleReady, { once: true });
    video.addEventListener("error", handleError, { once: true });
    video.load();
  });
}

export function preloadCalloutAsset(src: string) {
  const entry = getCacheEntry(src);

  if (entry.promise) {
    return entry.promise;
  }

  entry.status = "loading";

  entry.promise = (async () => {
    if (typeof window === "undefined") {
      entry.status = "ready";
      return entry.status;
    }

    try {
      if (VIDEO_ASSET_PATTERN.test(src)) {
        await preloadVideo(src);
      } else if (IMAGE_ASSET_PATTERN.test(src)) {
        await preloadImage(src);
      } else {
        await fetch(src, { cache: "force-cache" });
      }

      entry.status = "ready";
    } catch {
      entry.status = "error";
    }

    return entry.status;
  })();

  return entry.promise;
}
