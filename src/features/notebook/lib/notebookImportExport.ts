import JSZip from "jszip";
import { getDirectory, readIndex, writeBlob } from "@/shared/lib/opfs-core";
import { addDirectoryToZip, downloadFolderAsZip } from "@/shared/lib/opfs-zip";
import { downloadBlob } from "@/shared/lib/utils";
import type { Notebook } from "../types/notebook";
import { getNotebook, saveNotebook } from "./opfs-notebook";

/** Build a filesystem-safe slug from a notebook title for the download name. */
function slug(raw: string): string {
  const s = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return s || "notebook";
}

function getZipFolder(parent: JSZip, name: string): JSZip {
  const folder = parent.folder(name);
  if (!folder) {
    throw new Error(`Failed to create zip folder: ${name}`);
  }
  return folder;
}

/**
 * Reconcile an imported notebook folder with the collection index.
 *
 * Notebook metadata lives in `notebook.json` (not a format the generic
 * `rebuildFolderIndex` understands), so after extracting a folder we read it
 * back, force its id to match the folder, and re-register it via
 * `saveNotebook` (which writes notebook.json + the index entry).
 *
 * @param bumpUpdatedAt When true, set `updatedAt` to now so the notebook sorts
 *   to the top (used for single imports). Bulk imports preserve the original.
 */
async function reconcileImportedNotebook(id: string, { bumpUpdatedAt }: { bumpUpdatedAt: boolean }): Promise<string> {
  const existing = await getNotebook(id);
  const now = new Date().toISOString();
  const notebook: Notebook = {
    id,
    title: existing?.title || "Imported Notebook",
    customTitle: existing?.customTitle,
    createdAt: existing?.createdAt || now,
    updatedAt: bumpUpdatedAt ? now : existing?.updatedAt || now,
  };
  await saveNotebook(notebook);
  return id;
}

// ============================================================================
// Single notebook (used by the notebook sidebar)
// ============================================================================

/**
 * Export a single notebook (metadata, messages, sources, and outputs) as a
 * ZIP download. The notebook folder's contents are placed at the ZIP root.
 */
export async function exportNotebookAsZip(notebookId: string, title?: string): Promise<void> {
  const date = new Date().toISOString().split("T")[0];
  const filename = `wingman-notebook-${slug(title ?? notebookId)}-${date}.zip`;
  await downloadFolderAsZip(`notebooks/${notebookId}`, filename);
}

/**
 * Import a notebook from a ZIP produced by {@link exportNotebookAsZip}.
 *
 * The notebook is always imported under a fresh id (never overwrites an
 * existing one), the `notebook.json` id is reconciled with that new id, and
 * the collection index is updated so the notebook appears in the sidebar.
 *
 * @returns The id of the newly imported notebook.
 */
export async function importNotebookFromZip(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(file);
  const newId = crypto.randomUUID();
  const base = `notebooks/${newId}`;

  await getDirectory(base, { create: true });

  for (const [relativePath, entry] of Object.entries(zip.files)) {
    const fullPath = `${base}/${relativePath}`;
    if (entry.dir) {
      await getDirectory(fullPath.replace(/\/$/, ""), { create: true });
    } else {
      const content = await entry.async("arraybuffer");
      await writeBlob(fullPath, new Blob([content]));
    }
  }

  return reconcileImportedNotebook(newId, { bumpUpdatedAt: true });
}

// ============================================================================
// Bulk (used by Settings — mirrors the agents import/export)
// ============================================================================

/**
 * Export all notebooks bundled into a single ZIP, each under
 * `notebooks/{id}/…` so the archive is self-describing.
 */
export async function exportNotebooksAsZip(): Promise<void> {
  const zip = new JSZip();

  try {
    const index = await readIndex("notebooks");
    const notebooksZip = getZipFolder(zip, "notebooks");

    for (const entry of index) {
      const folder = getZipFolder(notebooksZip, entry.id);
      try {
        const handle = await getDirectory(`notebooks/${entry.id}`);
        await addDirectoryToZip(handle, folder);
      } catch {
        /* notebook folder missing — skip */
      }
    }
  } catch {
    /* no notebooks */
  }

  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  downloadBlob(blob, `wingman-notebooks-${new Date().toISOString().split("T")[0]}.zip`);
}

/**
 * Import notebooks from a ZIP. Supports two layouts:
 *  1. Bulk: `notebooks/{id}/…` (from {@link exportNotebooksAsZip}) — each id is
 *     preserved and merged with any existing notebook of that id.
 *  2. Flat: `notebook.json` at the root (a single-notebook export) — a fresh
 *     id is generated.
 *
 * Merges with existing data and rebuilds the affected index entries.
 */
export async function importNotebooksFromZip(file: Blob): Promise<void> {
  const zip = await JSZip.loadAsync(file);
  const paths = Object.keys(zip.files);
  const isBulk = paths.some((p) => p.startsWith("notebooks/"));
  const isFlat = !isBulk && paths.some((p) => p === "notebook.json");

  const importedIds = new Set<string>();

  if (isFlat) {
    const newId = crypto.randomUUID();
    for (const [relativePath, entry] of Object.entries(zip.files)) {
      const fullPath = `notebooks/${newId}/${relativePath}`;
      if (entry.dir) {
        await getDirectory(fullPath.replace(/\/$/, ""), { create: true });
      } else {
        const content = await entry.async("arraybuffer");
        await writeBlob(fullPath, new Blob([content]));
      }
    }
    importedIds.add(newId);
  } else {
    for (const [relativePath, entry] of Object.entries(zip.files)) {
      if (!relativePath.startsWith("notebooks/")) continue;

      const after = relativePath.slice("notebooks/".length);
      if (!after) continue;

      // Capture the per-notebook folder id; skip the collection index.json.
      const id = after.split("/")[0];
      if (!id || id === "index.json") continue;
      importedIds.add(id);

      const fullPath = `notebooks/${after}`;
      if (entry.dir) {
        await getDirectory(fullPath.replace(/\/$/, ""), { create: true });
      } else {
        const content = await entry.async("arraybuffer");
        await writeBlob(fullPath, new Blob([content]));
      }
    }
  }

  for (const id of importedIds) {
    await reconcileImportedNotebook(id, { bumpUpdatedAt: false });
  }
}

/**
 * Opens a file picker and imports notebooks from the selected ZIP.
 * Handles the confirmation dialog, alert, and page reload on success.
 */
export function triggerNotebookImport(): void {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".zip";
  input.multiple = false;

  input.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!window.confirm("Import notebooks from ZIP? This will merge with your existing notebooks.")) return;

    try {
      await importNotebooksFromZip(file);
      alert("Notebooks imported successfully! Please refresh the page to see the changes.");
      window.location.reload();
    } catch (error) {
      console.error("Failed to import notebooks:", error);
      alert("Failed to import notebooks. Please check the file and try again.");
    }
  };

  input.click();
}
