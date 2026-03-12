import { sceneList } from "../data/experience";

export type StillLoadStatus = "idle" | "loading" | "ready" | "error";

type StillListener = (status: StillLoadStatus) => void;

interface StillCacheEntry {
  image: HTMLImageElement | null;
  listeners: Set<StillListener>;
  promise: Promise<StillLoadStatus> | null;
  status: StillLoadStatus;
}

const stillCache = new Map<string, StillCacheEntry>();

function getCacheEntry(src: string) {
  const existingEntry = stillCache.get(src);

  if (existingEntry) {
    return existingEntry;
  }

  const nextEntry: StillCacheEntry = {
    image: null,
    listeners: new Set(),
    promise: null,
    status: "idle",
  };

  stillCache.set(src, nextEntry);
  return nextEntry;
}

function emit(src: string) {
  const entry = getCacheEntry(src);

  entry.listeners.forEach((listener) => {
    listener(entry.status);
  });
}

export function getStillLoadStatus(src: string) {
  return getCacheEntry(src).status;
}

export function subscribeToStill(src: string, listener: StillListener) {
  const entry = getCacheEntry(src);

  entry.listeners.add(listener);
  listener(entry.status);

  return () => {
    entry.listeners.delete(listener);
  };
}

export function preloadStill(src: string) {
  const entry = getCacheEntry(src);

  if (entry.promise) {
    return entry.promise;
  }

  entry.status = "loading";
  emit(src);

  entry.promise = (async () => {
    if (typeof window === "undefined") {
      entry.status = "ready";
      emit(src);
      return entry.status;
    }

    const image = new Image();
    image.decoding = "async";
    image.src = src;
    entry.image = image;

    try {
      if (image.complete && image.naturalWidth > 0) {
        if (typeof image.decode === "function") {
          await image.decode().catch(() => undefined);
        }
      } else if (typeof image.decode === "function") {
        await image.decode();
      } else {
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error(`Failed to preload still: ${src}`));
        });
      }

      entry.status = image.naturalWidth > 0 ? "ready" : "error";
    } catch {
      entry.status = image.complete && image.naturalWidth > 0 ? "ready" : "error";
    }

    emit(src);
    return entry.status;
  })();

  return entry.promise;
}

export function preloadSceneStills() {
  sceneList.forEach((scene) => {
    void preloadStill(scene.holdImageSrc);
  });
}
