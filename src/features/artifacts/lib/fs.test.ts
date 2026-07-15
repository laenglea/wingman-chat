import { beforeEach, describe, expect, it, vi } from "vitest";

const opfs = vi.hoisted(() => ({
  deleteArtifact: vi.fn(),
  deleteArtifactFolder: vi.fn(),
  listArtifacts: vi.fn(),
  readArtifact: vi.fn(),
  writeArtifact: vi.fn(),
}));

vi.mock("@/shared/lib/opfs", () => opfs);

import { FileSystemManager } from "./fs";

describe("FileSystemManager.renameFile", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects a folder move when any destination file already exists", async () => {
    const files = new Map([
      ["/source/a.html", { content: "a" }],
      ["/source/nested/b.css", { content: "b" }],
      ["/target/nested/b.css", { content: "existing" }],
    ]);
    opfs.listArtifacts.mockResolvedValue([...files.keys()]);
    opfs.readArtifact.mockImplementation(async (_chatId: string, path: string) => files.get(path));

    const moved = await new FileSystemManager("chat").renameFile("/source", "/target");

    expect(moved).toBe(false);
    expect(opfs.writeArtifact).not.toHaveBeenCalled();
    expect(opfs.deleteArtifact).not.toHaveBeenCalled();
    expect(opfs.deleteArtifactFolder).not.toHaveBeenCalled();
  });

  it("rolls back staged destination files when a folder write fails", async () => {
    const files = new Map([
      ["/source/a.html", { content: "a" }],
      ["/source/b.css", { content: "b" }],
    ]);
    opfs.listArtifacts.mockResolvedValue([...files.keys()]);
    opfs.readArtifact.mockImplementation(async (_chatId: string, path: string) => files.get(path));
    opfs.writeArtifact.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("quota write failure"));
    opfs.deleteArtifact.mockResolvedValue(undefined);

    await expect(new FileSystemManager("chat").renameFile("/source", "/target")).rejects.toThrow("quota write failure");

    expect(opfs.deleteArtifactFolder).not.toHaveBeenCalled();
    expect(opfs.deleteArtifact).toHaveBeenCalledTimes(2);
    expect(opfs.deleteArtifact).toHaveBeenCalledWith("chat", "/target/a.html");
    expect(opfs.deleteArtifact).toHaveBeenCalledWith("chat", "/target/b.css");
  });

  it("removes a partial destination when a file write fails", async () => {
    opfs.listArtifacts.mockResolvedValue(["/source.html"]);
    opfs.readArtifact.mockResolvedValue({ content: "source" });
    opfs.writeArtifact.mockRejectedValue(new Error("stream close failure"));
    opfs.deleteArtifact.mockResolvedValue(undefined);

    await expect(new FileSystemManager("chat").renameFile("/source.html", "/target.html")).rejects.toThrow(
      "stream close failure",
    );

    expect(opfs.deleteArtifact).toHaveBeenCalledTimes(1);
    expect(opfs.deleteArtifact).toHaveBeenCalledWith("chat", "/target.html");
  });

  it("rejects moving a folder into itself", async () => {
    opfs.listArtifacts.mockResolvedValue(["/source/a.html"]);

    const moved = await new FileSystemManager("chat").renameFile("/source", "/source/nested");

    expect(moved).toBe(false);
    expect(opfs.readArtifact).not.toHaveBeenCalled();
    expect(opfs.writeArtifact).not.toHaveBeenCalled();
  });
});
