import { describe, expect, it } from "vitest";
import { parseToolArguments, toolArgumentHints } from "./toolArguments";

const createFileParameters = {
  type: "object",
  properties: {
    path: { type: "string" },
    content: { type: "string" },
  },
  required: ["path", "content"],
  additionalProperties: false,
};

describe("tool argument recovery", () => {
  it("identifies create_file content instead of its path as the payload", () => {
    expect(toolArgumentHints(createFileParameters)).toEqual({
      payloadKey: "content",
      otherKeys: ["path"],
    });
  });

  it("recovers unescaped multiline HTML without truncating embedded JSON keys", () => {
    const html = `<!doctype html>
<main class="card">Hello</main>
<script>const endpoint = {"method":"GET","path":"/api/items"};</script>`;
    const malformed = `{"path":"/index.html","content":"${html}"}`;

    expect(parseToolArguments(malformed, toolArgumentHints(createFileParameters))).toEqual({
      path: "/index.html",
      content: html,
    });
  });

  it("recovers interpreter code and trailing nullable/array arguments", () => {
    const parameters = {
      type: "object",
      properties: {
        code: { type: ["string", "null"] },
        path: { type: ["string", "null"] },
        packages: { type: ["array", "null"] },
      },
    };
    const malformed = `{"code":"print("hello")","path":null,"packages":["pandas"]}`;

    expect(parseToolArguments(malformed, toolArgumentHints(parameters))).toEqual({
      code: `print("hello")`,
      path: null,
      packages: ["pandas"],
    });
  });

  it("does not misidentify edit_file's path as its dominant text payload", () => {
    const parameters = {
      type: "object",
      properties: {
        path: { type: "string" },
        edits: {
          type: "array",
          items: {
            type: "object",
            properties: {
              find: { type: "string" },
              replace: { type: "string" },
              replace_all: { type: ["boolean", "null"] },
            },
          },
        },
      },
    };
    const malformed =
      `{"path":"/index.html","edits":[` +
      `{"find":"<h1 class="old">Hi</h1>","replace":"<h1 class="new">Hello</h1>","replace_all":false}]}`;

    expect(toolArgumentHints(parameters)).toEqual({});
    expect(parseToolArguments(malformed, toolArgumentHints(parameters))).toEqual({
      path: "/index.html",
      edits: [
        {
          find: `<h1 class="old">Hi</h1>`,
          replace: `<h1 class="new">Hello</h1>`,
          replace_all: false,
        },
      ],
    });
  });
});
