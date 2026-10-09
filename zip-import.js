(function (root) {
  "use strict";

  class ZipImportError extends Error {
    constructor(message, code) {
      super(message);
      this.name = "ZipImportError";
      this.code = code;
    }
  }

  function chatFileRank(path) {
    const basename = path.split("/").pop().toLowerCase();
    if (/^whatsapp chat with .+\.txt$/.test(basename)) {
      return 0;
    }
    if (/^chat\.txt$/.test(basename)) {
      return 1;
    }
    if (/(?:whatsapp|chat|conversation)/.test(basename)) {
      return 2;
    }
    return 3;
  }

  function extractWhatsAppChat(zipBytes) {
    let entries;
    try {
      entries = root.fflate.unzipSync(zipBytes);
    } catch {
      throw new ZipImportError(
        "This ZIP file is invalid or could not be extracted. Try selecting a valid WhatsApp export.",
        "INVALID_ZIP"
      );
    }

    const candidates = Object.entries(entries)
      .filter(([path, bytes]) =>
        /\.txt$/i.test(path) &&
        !path.replace(/\\/g, "/").split("/").some(part => part === "__MACOSX") &&
        bytes instanceof Uint8Array
      )
      .sort(([pathA], [pathB]) => {
        const rankDifference = chatFileRank(pathA) - chatFileRank(pathB);
        if (rankDifference !== 0) {
          return rankDifference;
        }
        const normalizedA = pathA.toLowerCase();
        const normalizedB = pathB.toLowerCase();
        return normalizedA < normalizedB ? -1 : normalizedA > normalizedB ? 1 : pathA < pathB ? -1 : pathA > pathB ? 1 : 0;
      });

    if (candidates.length === 0) {
      throw new ZipImportError(
        "This ZIP does not contain a suitable .txt chat export.",
        "NO_CHAT_TEXT"
      );
    }

    const [path, bytes] = candidates[0];
    return {
      text: new TextDecoder("utf-8").decode(bytes),
      path,
      textFileCount: candidates.length,
      selectionReason: chatFileRank(path) === 0
        ? "preferred WhatsApp chat export filename"
        : chatFileRank(path) === 1
          ? "standard chat.txt filename"
          : chatFileRank(path) === 2
            ? "chat-related filename"
            : "first filename in alphabetical order"
    };
  }

  root.ThreadPulseZipImport = { extractWhatsAppChat, ZipImportError };
})(globalThis);
