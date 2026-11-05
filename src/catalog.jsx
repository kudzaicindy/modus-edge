import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getShopFilters } from "./data";
import {
  CATALOG_EVENT,
  adminLogin,
  adminLogout,
  applyLocalSeed,
  buildCatalog,
  deleteProduct as storeDelete,
  exportCatalog,
  fetchCatalog,
  findCatalogProduct,
  importCatalog as storeImport,
  isAdminAuthed,
  listCategories,
  readFileAsDataUrl,
  resetCatalog as storeReset,
  setProductImage as storeSetImage,
  upsertProduct as storeUpsert,
} from "./catalogStore";

const CatalogContext = createContext(null);

function snapshot() {
  return {
    products: buildCatalog(false),
    adminProducts: buildCatalog(true),
    categories: listCategories(),
    shopFilters: getShopFilters(),
    revision: Date.now(),
  };
}

export function CatalogProvider({ children }) {
  const [bundle, setBundle] = useState(snapshot);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    setBundle(snapshot());
  }, []);

  useEffect(() => {
    let alive = true;
    fetchCatalog()
      .then(() => {
        if (!alive) return;
        setError("");
        refresh();
        setReady(true);
      })
      .catch((err) => {
        if (!alive) return;
        console.error(err);
        setError(err.message || "Could not load catalogue from server");
        applyLocalSeed();
        refresh();
        setReady(true);
      });

    const onChange = () => refresh();
    window.addEventListener(CATALOG_EVENT, onChange);
    return () => {
      alive = false;
      window.removeEventListener(CATALOG_EVENT, onChange);
    };
  }, [refresh]);

  const upsertProduct = useCallback(
    async (input) => {
      const saved = await storeUpsert(input);
      refresh();
      return saved;
    },
    [refresh]
  );

  const deleteProduct = useCallback(
    async (id) => {
      await storeDelete(id);
      refresh();
    },
    [refresh]
  );

  const setProductImage = useCallback(
    async (id, imageUrl, colorName) => {
      const saved = await storeSetImage(id, imageUrl, colorName);
      refresh();
      return saved;
    },
    [refresh]
  );

  const importCatalog = useCallback(
    async (raw) => {
      await storeImport(raw);
      refresh();
    },
    [refresh]
  );

  const resetCatalog = useCallback(async () => {
    await storeReset();
    refresh();
  }, [refresh]);

  const findProduct = useCallback(
    (id) => findCatalogProduct(id, { includeHidden: true }),
    [bundle.revision]
  );

  const value = useMemo(
    () => ({
      products: bundle.products,
      adminProducts: bundle.adminProducts,
      categories: bundle.categories,
      shopFilters: bundle.shopFilters,
      revision: bundle.revision,
      ready,
      error,
      findProduct,
      upsertProduct,
      deleteProduct,
      setProductImage,
      exportCatalog,
      importCatalog,
      resetCatalog,
      readFileAsDataUrl,
      refresh,
      reload: async () => {
        await fetchCatalog();
        refresh();
      },
    }),
    [
      bundle,
      ready,
      error,
      findProduct,
      upsertProduct,
      deleteProduct,
      setProductImage,
      importCatalog,
      resetCatalog,
      refresh,
    ]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog needs CatalogProvider");
  return ctx;
}

export { adminLogin, adminLogout, isAdminAuthed, readFileAsDataUrl };
