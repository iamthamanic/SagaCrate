/**
 * Object-URL session helpers for preview-first intake (#634).
 * Location: src/app/media/intake/object-url-registry.ts
 *
 * Pure registry logic — no React. Callers inject create/revoke for tests.
 */

export type ObjectUrlFactory = {
  readonly create: (blob: Blob | MediaSource) => string;
  readonly revoke: (url: string) => void;
};

export type ObjectUrlRegistry = {
  readonly urls: ReadonlySet<string>;
  readonly create: (blob: Blob | MediaSource) => string;
  readonly revokeAll: () => ObjectUrlRegistry;
  readonly revokeOne: (url: string) => ObjectUrlRegistry;
};

export function createObjectUrlRegistry(
  factory: ObjectUrlFactory,
  initial: ReadonlySet<string> = new Set(),
): ObjectUrlRegistry {
  const urls = new Set(initial);

  return {
    get urls() {
      return urls;
    },
    create(blob) {
      const url = factory.create(blob);
      urls.add(url);
      return url;
    },
    revokeAll() {
      for (const url of urls) {
        factory.revoke(url);
      }
      urls.clear();
      return createObjectUrlRegistry(factory, urls);
    },
    revokeOne(url) {
      if (urls.has(url)) {
        factory.revoke(url);
        urls.delete(url);
      }
      return createObjectUrlRegistry(factory, urls);
    },
  };
}

/** Browser default factory. */
export function browserObjectUrlFactory(): ObjectUrlFactory {
  return {
    create: (blob) => URL.createObjectURL(blob as Blob),
    revoke: (url) => {
      URL.revokeObjectURL(url);
    },
  };
}
