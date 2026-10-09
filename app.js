(function () {
  "use strict";

  const fileInput = document.getElementById("chat-file");
  const fileName = document.getElementById("file-name");
  const status = document.getElementById("status");
  const messageCount = document.getElementById("message-count");
  const messageList = document.getElementById("message-list");
  const emptyState = document.getElementById("empty-state");
  const analysisOverview = document.getElementById("analysis-overview");
  const ANALYSIS_CATEGORIES = ["actions", "deadlines", "decisions", "urgent", "mentions"];

  function clearMessages() {
    messageList.replaceChildren();
    emptyState.hidden = false;
    messageCount.textContent = "0 messages";
  }

  function clearAnalysis() {
    analysisOverview.textContent = "Choose a supported export to see a local overview.";
    for (const category of [...ANALYSIS_CATEGORIES, "priority"]) {
      const list = document.getElementById(`${category}-list`);
      const empty = category === "priority"
        ? document.getElementById("priority-empty")
        : list.closest(".candidate-section").querySelector(".analysis-empty");
      list.replaceChildren();
      empty.hidden = false;
    }
  }

  function showError(message) {
    clearMessages();
    clearAnalysis();
    status.textContent = message;
    status.dataset.kind = "error";
  }

  function createAnalysisItem(item, isPriority) {
    const message = item.message;
    const element = document.createElement("li");
    element.className = "analysis-item";

    const meta = document.createElement("div");
    meta.className = "analysis-meta";

    const sender = document.createElement("span");
    sender.className = "message-sender";
    sender.textContent = message.sender;

    const timestamp = document.createElement("span");
    timestamp.className = "message-time";
    timestamp.textContent = message.timestamp;
    meta.append(sender, timestamp);
    element.append(meta);

    const labels = isPriority ? item.labels : [item.evidence.join(" · ")];
    const tagRow = document.createElement("p");
    tagRow.className = "analysis-tags";
    tagRow.textContent = isPriority
      ? labels.join(" · ")
      : `Matched wording: ${labels[0]}`;
    element.append(tagRow);

    const content = document.createElement("p");
    content.className = "message-content";
    content.textContent = message.content;
    element.append(content);
    return element;
  }

  function renderAnalysisList(listId, items, emptyMessage, isPriority) {
    const list = document.getElementById(listId);
    const empty = isPriority
      ? document.getElementById("priority-empty")
      : list.closest(".candidate-section").querySelector(".analysis-empty");
    const fragment = document.createDocumentFragment();

    for (const item of items) {
      fragment.append(createAnalysisItem(item, isPriority));
    }

    list.replaceChildren(fragment);
    empty.hidden = items.length > 0;
    if (items.length === 0) {
      empty.textContent = emptyMessage;
    }
  }

  function renderAnalysis(analysis) {
    analysisOverview.textContent = analysis.overview;
    renderAnalysisList(
      "priority-list",
      analysis.keyMessages,
      analysis.hasCandidates ? "No candidate priorities to show." : "No candidate priorities detected.",
      true
    );
    renderAnalysisList("actions-list", analysis.categories.actions, "No candidate action items detected.", false);
    renderAnalysisList("deadlines-list", analysis.categories.deadlines, "No candidate deadlines detected.", false);
    renderAnalysisList("decisions-list", analysis.categories.decisions, "No candidate decisions detected.", false);
    renderAnalysisList("urgent-list", analysis.categories.urgent, "No explicit urgency signals detected.", false);
    renderAnalysisList("mentions-list", analysis.categories.mentions, "No direct @mentions detected.", false);
  }

  function renderMessages(messages) {
    const fragment = document.createDocumentFragment();

    for (const message of messages) {
      const item = document.createElement("li");
      item.className = "message-item";

      const meta = document.createElement("div");
      meta.className = "message-meta";

      const sender = document.createElement("span");
      sender.className = "message-sender";
      sender.textContent = message.sender;

      const timestamp = document.createElement("time");
      timestamp.className = "message-time";
      timestamp.textContent = message.timestamp;
      timestamp.setAttribute("aria-label", `Timestamp: ${message.timestamp}`);

      const content = document.createElement("p");
      content.className = "message-content";
      content.textContent = message.content;

      meta.append(sender, timestamp);
      item.append(meta, content);
      fragment.append(item);
    }

    messageList.replaceChildren(fragment);
    emptyState.hidden = messages.length > 0;
    messageCount.textContent = `${messages.length} ${messages.length === 1 ? "message" : "messages"}`;
  }

  async function handleFileSelection() {
    const file = fileInput.files && fileInput.files[0];
    clearMessages();
    clearAnalysis();
    status.removeAttribute("data-kind");

    if (!file) {
      fileName.textContent = "No file selected";
      status.textContent = "Your chat will be read and parsed on this device only.";
      return;
    }

    fileName.textContent = file.name;

    if (!file.name.toLowerCase().endsWith(".txt")) {
      showError("Please choose a WhatsApp text export with a .txt file extension.");
      return;
    }

    try {
      const text = await file.text();
      const messages = MissedItParser.parseWhatsAppExport(text);
      const analysis = MissedItAnalyzer.analyzeMessages(messages);

      renderMessages(messages);
      renderAnalysis(analysis);
      const skippedLineNotice = messages.unparsedLineCount > 0
        ? ` ${messages.unparsedLineCount} unrecognized line(s) were skipped.`
        : "";
      status.textContent = `Read and parsed ${messages.length} messages locally.${skippedLineNotice} The file was not uploaded.`;
    } catch (error) {
      if (error instanceof MissedItParser.ChatParseError) {
        showError(error.message);
      } else {
        showError("The file could not be read. Please try selecting it again.");
        console.error("MissedIt could not read the selected file.", error);
      }
    }
  }

  fileInput.addEventListener("change", handleFileSelection);
})();
