(function (root) {
  "use strict";

  const CATEGORY_ORDER = ["urgent", "deadlines", "actions", "decisions", "mentions"];
  const CATEGORY_LABELS = {
    urgent: "Urgency",
    deadlines: "Deadline",
    actions: "Action item",
    decisions: "Decision",
    mentions: "Mention"
  };
  const PRIORITY_WEIGHT = {
    urgent: 5,
    deadlines: 4,
    actions: 3,
    decisions: 2,
    mentions: 1
  };

  const DATE_EXPRESSION = [
    "\\d{1,2}[/-]\\d{1,2}(?:[/-]\\d{2,4})?",
    "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\.?\\s+\\d{1,2}(?:,?\\s+\\d{4})?",
    "\\d{1,2}\\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\.?(?:\\s+\\d{4})?",
    "(?:today|tomorrow|(?:this|next)\\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday))",
    "(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)"
  ].join("|");
  const TIME_EXPRESSION = "(?:\\d{1,2}(?::[0-5]\\d)?\\s*(?:a\\.?m\\.?|p\\.?m\\.?)|(?:[01]?\\d|2[0-3]):[0-5]\\d)";

  const DETECTORS = {
    actions: [
      /\b(?:please\s+do|need\s+to|don't\s+forget|do\s+not\s+forget|send|submit|complete)\b/gi
    ],
    deadlines: [
      new RegExp(
        `\\b(?:by|due(?:\\s+on)?|before|deadline(?:\\s+is)?\\s*:?|no\\s+later\\s+than|until|on)\\s+(?:${DATE_EXPRESSION}|eod|end\\s+of\\s+day|noon|midnight|${TIME_EXPRESSION})(?:\\s+(?:at\\s+)?${TIME_EXPRESSION})?`,
        "gi"
      ),
      new RegExp(
        `\\b(?:${DATE_EXPRESSION})\\s+at\\s+${TIME_EXPRESSION}\\b`,
        "gi"
      )
    ],
    decisions: [/\b(?:decided|agreed|confirmed|finali[sz]ed)\b/gi],
    urgent: [/\b(?:urgent(?:ly)?|asap|important|by\s+today)\b/gi],
    mentions: [/@[A-Za-z0-9_][A-Za-z0-9_.-]*/g]
  };

  function collectMatches(content, patterns) {
    const matches = [];
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      for (const match of content.matchAll(pattern)) {
        matches.push(match[0].replace(/[.,;!?]+$/, ""));
      }
    }
    const uniqueMatches = [...new Map(matches.map(match => [match.toLowerCase(), match])).values()];
    return uniqueMatches.filter(match => !uniqueMatches.some(other =>
      other.length > match.length && other.toLowerCase().includes(match.toLowerCase())
    ));
  }

  function analyzeMessages(messages) {
    if (!Array.isArray(messages)) {
      throw new TypeError("Expected a list of parsed messages.");
    }

    const categories = Object.fromEntries(CATEGORY_ORDER.map(category => [category, []]));
    const priorityByMessage = new Map();
    const participants = new Set();

    for (const [index, sourceMessage] of messages.entries()) {
      if (!sourceMessage || typeof sourceMessage.sender !== "string" ||
          typeof sourceMessage.content !== "string" || typeof sourceMessage.timestamp !== "string") {
        throw new TypeError(`Message at index ${index} must include timestamp, sender, and content strings.`);
      }

      participants.add(sourceMessage.sender);
      const message = {
        timestamp: sourceMessage.timestamp,
        sender: sourceMessage.sender,
        content: sourceMessage.content
      };

      for (const category of CATEGORY_ORDER) {
        const evidence = collectMatches(message.content, DETECTORS[category]);
        if (evidence.length === 0) {
          continue;
        }

        categories[category].push({ message, evidence });
        let priorityItem = priorityByMessage.get(index);
        if (!priorityItem) {
          priorityItem = {
            message,
            categories: [],
            priority: 0,
            sourceIndex: index
          };
          priorityByMessage.set(index, priorityItem);
        }
        priorityItem.categories.push(category);
        priorityItem.priority = Math.max(priorityItem.priority, PRIORITY_WEIGHT[category]);
      }
    }

    const priorities = [...priorityByMessage.values()]
      .sort((left, right) => right.priority - left.priority || left.sourceIndex - right.sourceIndex)
      .map(({ message, categories: matchedCategories }) => ({
        message,
        categories: matchedCategories,
        labels: matchedCategories.map(category => CATEGORY_LABELS[category])
      }));
    const counts = Object.fromEntries(
      CATEGORY_ORDER.map(category => [category, categories[category].length])
    );
    const detectionCount = Object.values(counts).reduce((total, count) => total + count, 0);
    const overview = `Parsed ${messages.length} ${messages.length === 1 ? "message" : "messages"} from ` +
      `${participants.size} ${participants.size === 1 ? "participant" : "participants"}. ` +
      (detectionCount > 0
        ? `Found ${detectionCount} candidate signal${detectionCount === 1 ? "" : "s"}: ` +
          `${counts.actions} action item${counts.actions === 1 ? "" : "s"}, ` +
          `${counts.deadlines} deadline${counts.deadlines === 1 ? "" : "s"}, ` +
          `${counts.decisions} decision${counts.decisions === 1 ? "" : "s"}, ` +
          `${counts.urgent} urgency signal${counts.urgent === 1 ? "" : "s"}, and ` +
          `${counts.mentions} mention${counts.mentions === 1 ? "" : "s"}.`
        : "No candidate action items, deadlines, decisions, urgency signals, or mentions were detected.");

    return {
      overview,
      messageCount: messages.length,
      participantCount: participants.size,
      counts,
      categories,
      priorities,
      keyMessages: priorities.slice(0, 3),
      hasCandidates: priorities.length > 0
    };
  }

  root.MissedItAnalyzer = { analyzeMessages };
})(globalThis);
