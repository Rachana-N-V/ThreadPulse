"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

globalThis.fflate = require("./vendor/fflate.js");
require("./zip-import.js");

const { extractWhatsAppChat, ZipImportError } = globalThis.ThreadPulseZipImport;

function createZip(files) {
  return globalThis.fflate.zipSync(
    Object.fromEntries(
      Object.entries(files).map(([name, content]) => [name, globalThis.fflate.strToU8(content)])
    )
  );
}

test("extracts the preferred WhatsApp chat export from a ZIP with multiple text files", () => {
  const result = extractWhatsAppChat(createZip({
    "Readme.txt": "Not a conversation.",
    "WhatsApp Chat with Alex.txt": "09/10/26, 10:00 - Alex: Hello"
  }));

  assert.equal(result.path, "WhatsApp Chat with Alex.txt");
  assert.equal(result.text, "09/10/26, 10:00 - Alex: Hello");
  assert.equal(result.textFileCount, 2);
  assert.equal(result.selectionReason, "preferred WhatsApp chat export filename");
});

test("chooses a deterministic alphabetical fallback when text filenames are generic", () => {
  const result = extractWhatsAppChat(createZip({
    "zeta.txt": "later",
    "alpha.txt": "first"
  }));

  assert.equal(result.path, "alpha.txt");
  assert.equal(result.textFileCount, 2);
  assert.equal(result.selectionReason, "first filename in alphabetical order");
});

test("rejects invalid ZIP data with a clear error", () => {
  assert.throws(
    () => extractWhatsAppChat(new Uint8Array([1, 2, 3])),
    error => error instanceof ZipImportError && error.code === "INVALID_ZIP"
  );
});

test("rejects a valid ZIP without a suitable text file", () => {
  assert.throws(
    () => extractWhatsAppChat(createZip({ "image.png": "not a chat" })),
    error => error instanceof ZipImportError && error.code === "NO_CHAT_TEXT"
  );
});
