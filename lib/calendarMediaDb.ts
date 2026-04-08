const databaseName = "wall-calendar-assignment";
const storeName = "calendar-media";
const legacyStoreName = "hero-images";
const databaseVersion = 2;

type MediaRecord = {
  id: string;
  dataUrl: string;
};

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(databaseName, databaseVersion);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName, {
          keyPath: "id"
        });
      }

      // Preserve old uploaded hero images from the previous store layout.
      if (database.objectStoreNames.contains(legacyStoreName)) {
        const legacyStore = request.transaction?.objectStore(legacyStoreName);
        const mediaStore = request.transaction?.objectStore(storeName);

        legacyStore?.get("primary").addEventListener("success", (event) => {
          const result = (event.target as IDBRequest<MediaRecord | undefined>).result;

          if (result?.dataUrl) {
            mediaStore?.put({
              id: "hero-image",
              dataUrl: result.dataUrl
            } satisfies MediaRecord);
          }
        });
      }
    };
  });
}

export async function loadMediaAsset(assetId: string) {
  const database = await openDatabase();

  return new Promise<string | null>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(assetId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const result = request.result as MediaRecord | undefined;
      resolve(result?.dataUrl ?? null);
    };

    transaction.oncomplete = () => database.close();
  });
}

export async function saveMediaAsset(assetId: string, dataUrl: string) {
  const database = await openDatabase();

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);

    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    store.put({
      id: assetId,
      dataUrl
    } satisfies MediaRecord);
  });
}

export async function deleteMediaAsset(assetId: string) {
  const database = await openDatabase();

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);

    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    store.delete(assetId);
  });
}
