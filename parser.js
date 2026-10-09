(function (root) {
  "use strict";

  const MESSAGE_START = /^\[?(\d{1,2}\/\d{1,2}\/(?:\d{2}|\d{4}),\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)\]?\s+-?\s*(.*)$/i;
  const DIRECTION_MARKS = /^[\u200E\u200F\u202A-\u202E\u2066-\u2069]+/;

  function isKnownSystemNotification(text) {
    const notification = text.trim();
    const colonIndex = notification.indexOf(":");
    const classificationText = colonIndex >= 0
      ? notification.slice(0, colonIndex).trim()
      : notification;
    return /^(?:.+?\s)?(?:messages and calls are end-to-end encrypted|this chat is with a business account|you created this group|.+? created group\b|.+? (?:added .+ to the group|removed .+ from the group|left the group|joined the group|joined using this group's invite link|changed the group (?:subject|description|name|icon|settings)\b|changed this group's (?:subject|description|name|icon|settings)\b|changed the subject\b|changed the group subject\b|changed the group description\b|changed the group name\b)|.+? (?:was added to|were added to) the group\b|missed (?:voice|video) call\b)/i.test(classificationText);
  }

  class ChatParseError extends Error {
    constructor(message, code) {
      super(message);
      this.name = "ChatParseError";
      this.code = code;
    }
  }

  function parseWhatsAppExport(text) {
    if (typeof text !== "string" || text.trim() === "") {
      throw new ChatParseError("The selected file is empty.", "EMPTY_FILE");
    }

    const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
    while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
      lines.pop();
    }

    const messages = [];
    let currentMessage = null;
    let unparsedLineCount = 0;

    for (const line of lines) {
      const normalizedLine = line.replace(DIRECTION_MARKS, "");
      const match = normalizedLine.match(MESSAGE_START);
      if (match) {
        if (currentMessage) {
          messages.push(currentMessage);
        }

        const timestamp = match[1].trim();
        const remainder = match[2];
        if (isKnownSystemNotification(remainder)) {
          currentMessage = null;
          continue;
        }

        const senderSeparator = remainder.indexOf(":");

        if (senderSeparator <= 0) {
          currentMessage = null;
          if (remainder.trim() !== "") {
            unparsedLineCount++;
          }
          continue;
        }

        const sender = remainder.slice(0, senderSeparator).trim();
        const content = remainder.slice(senderSeparator + 1).replace(/^ /, "");
        if (!sender) {
          currentMessage = null;
          unparsedLineCount++;
          continue;
        }

        currentMessage = { timestamp, sender, content };
      } else if (currentMessage) {
        currentMessage.content += `\n${normalizedLine}`;
      } else if (normalizedLine.trim() !== "" && !isKnownSystemNotification(normalizedLine)) {
        unparsedLineCount++;
      }
    }

    if (currentMessage) {
      messages.push(currentMessage);
    }

    if (messages.length === 0) {
      throw new ChatParseError(
        unparsedLineCount > 0
          ? `This file does not contain messages in the supported WhatsApp text format. ${unparsedLineCount} line(s) could not be parsed.`
          : "This file does not contain messages in the supported WhatsApp text format.",
        "UNSUPPORTED_FORMAT"
      );
    }

    Object.defineProperty(messages, "unparsedLineCount", { value: unparsedLineCount });
    return messages;
  }

  root.MissedItParser = { parseWhatsAppExport, ChatParseError };
})(globalThis);
