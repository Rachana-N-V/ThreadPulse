"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
require("./parser.js");

const { parseWhatsAppExport, ChatParseError } = globalThis.MissedItParser;

test("parses a normal message with a 12-hour timestamp", () => {
  assert.deepEqual(parseWhatsAppExport("09/10/26, 1:05 PM - Rachana: Hello"), [
    { timestamp: "09/10/26, 1:05 PM", sender: "Rachana", content: "Hello" }
  ]);
});

test("parses a normal message with a 24-hour timestamp", () => {
  assert.deepEqual(parseWhatsAppExport("09/10/2026, 13:05 - Dev: Ready"), [
    { timestamp: "09/10/2026, 13:05", sender: "Dev", content: "Ready" }
  ]);
});

test("parses pasted WhatsApp text through the same export parser", () => {
  const pastedText = "09/10/26, 13:05 - Rachana: Please send the notes.\n" +
    "09/10/26, 13:06 - Dev: I will review.";
  const messages = parseWhatsAppExport(pastedText);

  assert.equal(messages.length, 2);
  assert.equal(messages[0].sender, "Rachana");
  assert.equal(messages[1].content, "I will review.");
});

test("keeps continuation lines in the same message", () => {
  const messages = parseWhatsAppExport(
    "09/10/26, 13:05 - Rachana: First line\nSecond line\n\nThird line"
  );
  assert.equal(messages.length, 1);
  assert.equal(messages[0].content, "First line\nSecond line\n\nThird line");
});

test("skips a known system notification containing a colon", () => {
  const messages = parseWhatsAppExport(
    "09/10/26, 13:05 - Alex changed the group subject to: Planning: October\n" +
    "09/10/26, 13:06 - Rachana: I saw the update."
  );
  assert.deepEqual(messages, [
    { timestamp: "09/10/26, 13:06", sender: "Rachana", content: "I saw the update." }
  ]);
  assert.equal(messages.unparsedLineCount, 0);
});

test("preserves an ordinary sender message resembling a system notification", () => {
  const messages = parseWhatsAppExport(
    "09/10/26, 13:05 - Alex: changed the group subject to: this is only a suggestion"
  );
  assert.equal(messages.length, 1);
  assert.deepEqual(messages[0], {
    timestamp: "09/10/26, 13:05",
    sender: "Alex",
    content: "changed the group subject to: this is only a suggestion"
  });
});

test("does not append a final newline to the preceding message", () => {
  const messages = parseWhatsAppExport("09/10/26, 13:05 - Rachana: Hello\n");
  assert.equal(messages[0].content, "Hello");
});

test("strips a leading direction mark before matching a message boundary", () => {
  const messages = parseWhatsAppExport("\u200E09/10/26, 13:05 - Rachana: Hello");
  assert.deepEqual(messages, [
    { timestamp: "09/10/26, 13:05", sender: "Rachana", content: "Hello" }
  ]);
});

test("throws a clear empty-file parse error", () => {
  assert.throws(
    () => parseWhatsAppExport("\n \n"),
    error => error instanceof ChatParseError && error.code === "EMPTY_FILE"
  );
});

test("throws a clear unsupported-format error and counts unparsed lines", () => {
  assert.throws(
    () => parseWhatsAppExport("not a WhatsApp export\nanother invalid line"),
    error => error instanceof ChatParseError &&
      error.code === "UNSUPPORTED_FORMAT" &&
      error.message.includes("2 line(s) could not be parsed")
  );
});

test("reports unclassified lines alongside successfully parsed messages", () => {
  const messages = parseWhatsAppExport(
    "unrecognized preamble\n09/10/26, 13:05 - Rachana: Hello"
  );
  assert.equal(messages.length, 1);
  assert.equal(messages.unparsedLineCount, 1);
});
