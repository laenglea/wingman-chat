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

  it.each([
    {
      name: "double-quoted JSON",
      malformed: `{"code":"print("hello")","path":null,"packages":["pandas"]}`,
      expectedCode: `print("hello")`,
    },
    {
      name: "single-quoted object notation",
      malformed: `{'code':'print('hello')','path':null,'packages':['pandas']}`,
      expectedCode: `print('hello')`,
    },
    {
      name: "typographic structural quotes",
      malformed: `{“code”:“print("hello")”,“path”:null,“packages”:[“pandas”]}`,
      expectedCode: `print("hello")`,
    },
  ])("recovers $name without changing payload quotes", ({ malformed, expectedCode }) => {
    const parameters = {
      type: "object",
      properties: {
        code: { type: "string" },
        path: { type: ["string", "null"] },
        packages: { type: ["array", "null"] },
      },
    };

    expect(parseToolArguments(malformed, toolArgumentHints(parameters))).toEqual({
      code: expectedCode,
      path: null,
      packages: ["pandas"],
    });
  });

  it("keeps embedded sibling-shaped JSON when the outer optional field is omitted", () => {
    const parameters = {
      type: "object",
      properties: {
        code: { type: "string" },
        path: { type: ["string", "null"] },
      },
    };
    const code = `const request = {"method":"GET","path":"/api/items"};\nconsole.log(request);`;
    const malformed = `{"code":"${code}"}`;

    expect(parseToolArguments(malformed, toolArgumentHints(parameters))).toEqual({ code });
  });

  it("keeps a final source brace when the outer object brace is missing", () => {
    const parameters = {
      type: "object",
      properties: { code: { type: "string" }, path: { type: ["string", "null"] } },
    };
    const code = `function answer() { return { value: 42 }; }`;
    const malformed = `{"code":"${code}"`;

    expect(parseToolArguments(malformed, toolArgumentHints(parameters))).toEqual({ code });
  });

  it("derives payload hints from anyOf-style nullable schemas", () => {
    const parameters = {
      type: "object",
      properties: {
        path: { type: "string" },
        content: { anyOf: [{ type: "string" }, { type: "null" }] },
      },
    };

    expect(toolArgumentHints(parameters)).toEqual({ payloadKey: "content", otherKeys: ["path"] });
  });

  it("recovers nested trailing arguments instead of reducing them to null", () => {
    const parameters = {
      type: "object",
      properties: {
        code: { type: "string" },
        options: { type: "object" },
        inputs: { type: "array" },
      },
    };
    const malformed =
      `{"code":"console.log("run")",` +
      `"options":{"timeout":30,"env":{"MODE":"test"}},` +
      `"inputs":[{"path":"/a.csv"},{"path":"/b.csv"}]}`;

    expect(parseToolArguments(malformed, toolArgumentHints(parameters))).toEqual({
      code: `console.log("run")`,
      options: { timeout: 30, env: { MODE: "test" } },
      inputs: [{ path: "/a.csv" }, { path: "/b.csv" }],
    });
  });

  it("preserves valid JSON arguments exactly across quote-heavy payloads", () => {
    const parameters = {
      type: "object",
      properties: { code: { type: "string" }, path: { type: ["string", "null"] } },
    };
    const expected = {
      code: `const a = 'single'; const b = "double"; const c = \`template ${"${value}"}\`;`,
      path: null,
    };

    expect(parseToolArguments(JSON.stringify(expected), toolArgumentHints(parameters))).toEqual(expected);
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
