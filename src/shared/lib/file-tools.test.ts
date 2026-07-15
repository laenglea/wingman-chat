import { describe, expect, it } from "vitest";
import { createFileTools, type FileData, type WritableFileSource } from "./file-tools";

function memorySource(initial: Record<string, string> = {}): {
  files: Map<string, FileData>;
  source: WritableFileSource;
} {
  const files = new Map<string, FileData>(Object.entries(initial).map(([path, content]) => [path, { path, content }]));
  return {
    files,
    source: {
      async list() {
        return [...files.values()].map(({ path, content }) => ({ path, size: content.length }));
      },
      async read(path) {
        return files.get(path);
      },
      async write(path, content, contentType) {
        files.set(path, { path, content, contentType });
      },
      async remove(path) {
        return files.delete(path);
      },
      async move(from, to) {
        const file = files.get(from);
        if (!file) return false;
        files.delete(from);
        files.set(to, { ...file, path: to });
        return true;
      },
    },
  };
}

describe("artifact file tools", () => {
  it("advertises strict create and edit schemas", () => {
    const { source } = memorySource();
    const tools = createFileTools(source);
    const create = tools.find((tool) => tool.name === "create_file");
    const edit = tools.find((tool) => tool.name === "edit_file");

    expect(create).toBeDefined();
    expect(edit).toBeDefined();
    expect(create?.strict).toBe(true);
    expect(create?.parameters.additionalProperties).toBe(false);
    expect(edit?.strict).toBe(true);
    expect(edit?.parameters.additionalProperties).toBe(false);

    const edits = (edit?.parameters.properties as Record<string, Record<string, unknown>> | undefined)?.edits;
    expect(edits).toBeDefined();
    const item = edits?.items as Record<string, unknown>;
    expect(item.additionalProperties).toBe(false);
    expect(item.required).toEqual(["find", "replace", "replace_all"]);
  });

  it("writes normal string content unchanged", async () => {
    const { files, source } = memorySource();
    const create = createFileTools(source).find((tool) => tool.name === "create_file");
    const html = `<!doctype html><div class="card">Hello</div>`;

    expect(create).toBeDefined();
    await create?.function({ path: "/index.html", content: html });

    expect(files.get("/index.html")?.content).toBe(html);
  });

  it("narrowly recovers line arrays and wrapped HTML from non-strict providers", async () => {
    const { files, source } = memorySource();
    const create = createFileTools(source).find((tool) => tool.name === "create_file");

    expect(create).toBeDefined();
    await create?.function({ path: "/lines.html", content: ["<main>", "  Hello", "</main>"] });
    await create?.function({ path: "/wrapped.html", content: { html: `<p class="note">Hello</p>` } });
    await create?.function({ path: "/aliased.html", html: `<strong>Hello</strong>` });

    expect(files.get("/lines.html")?.content).toBe("<main>\n  Hello\n</main>");
    expect(files.get("/wrapped.html")?.content).toBe(`<p class="note">Hello</p>`);
    expect(files.get("/aliased.html")?.content).toBe(`<strong>Hello</strong>`);
  });

  it("still rejects arbitrary object content", async () => {
    const { files, source } = memorySource();
    const create = createFileTools(source).find((tool) => tool.name === "create_file");

    expect(create).toBeDefined();
    const result = await create?.function({ path: "/bad.html", content: { unexpected: true } });

    expect(files.has("/bad.html")).toBe(false);
    expect(result?.[0]).toEqual({
      type: "text",
      text: JSON.stringify({ error: "content is required and must be a string." }),
    });
  });

  it("applies quote-heavy HTML edits", async () => {
    const { files, source } = memorySource({
      "/index.html": `<h1 class="old">Hi</h1>`,
    });
    const edit = createFileTools(source).find((tool) => tool.name === "edit_file");

    expect(edit).toBeDefined();
    await edit?.function({
      path: "/index.html",
      edits: [
        {
          find: `<h1 class="old">Hi</h1>`,
          replace: `<h1 class="new">Hello</h1>`,
          replace_all: false,
        },
      ],
    });

    expect(files.get("/index.html")?.content).toBe(`<h1 class="new">Hello</h1>`);
  });
});
