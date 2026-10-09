(function () {
  "use strict";

  const fileInput = document.getElementById("chat-file");
  const fileName = document.getElementById("file-name");
  const pasteText = document.getElementById("chat-text");
  const status = document.getElementById("status");
  const importMethod = document.getElementById("import-method");
  const pasteMethod = document.getElementById("paste-method");
  const importPanel = document.getElementById("import-panel");
  const pastePanel = document.getElementById("paste-panel");
  const processPaste = document.getElementById("process-paste");
  const brief = document.getElementById("brief");
  const sourceName = document.getElementById("source-name");
  const sourceStatus = document.getElementById("source-status");
  const briefCount = document.getElementById("brief-count");
  const attentionList = document.getElementById("attention-list");
  const decisionsList = document.getElementById("decisions-list");
  const mentionsList = document.getElementById("mentions-list");
  const remainingList = document.getElementById("remaining-list");
  const transcriptList = document.getElementById("transcript-list");
  const remainingCount = document.getElementById("remaining-count");
  const transcriptCount = document.getElementById("transcript-count");
  const attentionEmpty = document.getElementById("attention-empty");
  const decisionsEmpty = document.getElementById("decisions-empty");
  const mentionsEmpty = document.getElementById("mentions-empty");
  const decisionsNote = document.getElementById("decisions-note");
  const mentionsNote = document.getElementById("mentions-note");
  const remainingEmpty = document.getElementById("remaining-empty");
  const remainingDisclosure = document.getElementById("remaining-disclosure");
  const transcriptDisclosure = document.getElementById("transcript-disclosure");
  const themeToggle = document.getElementById("theme-toggle");
  const themeLabel = document.getElementById("theme-label");
  const themeIcon = document.getElementById("theme-icon");
  const themeColor = document.querySelector('meta[name="theme-color"]');

  let activeMode = "import";
  let processingVersion = 0;

  function setTheme(theme, persist) {
    const isDark = theme === "dark";
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("aria-label", isDark ? "Dark theme" : "Light theme");
    themeToggle.title = isDark ? "Switch to light theme" : "Switch to dark theme";
    themeLabel.textContent = isDark ? "Dark theme" : "Light theme";
    themeIcon.textContent = isDark ? "☀" : "☾";
    themeColor.content = isDark ? "#151a17" : "#f6f5f0";

    if (persist) {
      try {
        localStorage.setItem("threadpulse-theme", isDark ? "dark" : "light");
      } catch (error) {
        console.warn("ThreadPulse could not save the theme preference.", error);
      }
    }
  }

  function setStatus(message, kind) {
    status.textContent = message;
    if (kind) {
      status.dataset.kind = kind;
    } else {
      status.removeAttribute("data-kind");
    }
  }

  function clearBrief() {
    brief.hidden = true;
    sourceName.textContent = "";
    sourceStatus.textContent = "";
    briefCount.textContent = "";
    remainingCount.textContent = "";
    transcriptCount.textContent = "";
    for (const list of [attentionList, decisionsList, mentionsList, remainingList, transcriptList]) {
      list.replaceChildren();
    }
    attentionEmpty.textContent = "No messages were flagged by the local checks.";
    decisionsEmpty.textContent = "No decision candidates detected.";
    mentionsEmpty.textContent = "No direct mentions detected.";
    decisionsNote.textContent = "";
    mentionsNote.textContent = "";
    decisionsNote.hidden = true;
    mentionsNote.hidden = true;
    remainingEmpty.textContent = "No additional flagged messages.";
    attentionEmpty.hidden = false;
    decisionsEmpty.hidden = false;
    mentionsEmpty.hidden = false;
    remainingEmpty.hidden = false;
    remainingDisclosure.open = false;
    transcriptDisclosure.open = false;
  }

  function resetAttempt() {
    processingVersion++;
    clearBrief();
    setStatus(
      activeMode === "import"
        ? "Choose a WhatsApp .txt export. It will be processed on this device."
        : "Paste a WhatsApp-exported conversation. It will be processed on this device."
    );
  }

  function setMode(mode) {
    if (mode === activeMode) {
      return;
    }

    activeMode = mode;
    resetAttempt();
    fileInput.value = "";
    fileName.textContent = "No file selected";
    importMethod.setAttribute("aria-pressed", String(mode === "import"));
    pasteMethod.setAttribute("aria-pressed", String(mode === "paste"));
    importPanel.hidden = mode !== "import";
    pastePanel.hidden = mode !== "paste";
  }

  function appendMessageCard(list, record, includeEvidence) {
    const message = record.message;
    const item = document.createElement("li");
    item.className = "message-card";

    const metadata = document.createElement("div");
    metadata.className = "message-metadata";
    const sender = document.createElement("span");
    sender.className = "message-sender";
    sender.textContent = message.sender;
    const timestamp = document.createElement("time");
    timestamp.className = "message-time";
    timestamp.textContent = message.timestamp;
    metadata.append(sender, timestamp);
    item.append(metadata);

    if (record.labels && record.labels.length > 0) {
      const labels = document.createElement("p");
      labels.className = "message-labels";
      labels.textContent = record.labels.join(" · ");
      item.append(labels);
    }

    if (includeEvidence && record.evidence.length > 0) {
      const evidence = document.createElement("p");
      evidence.className = "message-evidence";
      evidence.textContent = `Matched wording: ${record.evidence.join(" · ")}`;
      item.append(evidence);
    }

    const content = document.createElement("p");
    content.className = "message-content";
    content.textContent = message.content;
    item.append(content);
    list.append(item);
  }

  function renderRecords(list, empty, records, includeEvidence) {
    list.replaceChildren();
    for (const record of records) {
      appendMessageCard(list, record, includeEvidence);
    }
    empty.hidden = records.length > 0;
  }

  function renderBrief(messages, analysis, pulseBrief, source) {
    sourceName.textContent = source.label;
    const skippedLineNotice = messages.unparsedLineCount > 0
      ? ` · ${messages.unparsedLineCount} unrecognized line(s) skipped`
      : "";
    sourceStatus.textContent = `${source.kind} · Processed locally${skippedLineNotice}`;
    briefCount.textContent = `${analysis.messageCount} ${analysis.messageCount === 1 ? "message" : "messages"} · ` +
      `${pulseBrief.flaggedCount} flagged`;

    renderRecords(attentionList, attentionEmpty, pulseBrief.attention, true);
    renderRecords(decisionsList, decisionsEmpty, pulseBrief.decisions, true);
    renderRecords(mentionsList, mentionsEmpty, pulseBrief.mentions, true);
    renderRecords(remainingList, remainingEmpty, pulseBrief.remaining, true);
    if (pulseBrief.decisionShownElsewhere > 0) {
      decisionsNote.textContent = `${pulseBrief.decisionShownElsewhere} decision ` +
        `${pulseBrief.decisionShownElsewhere === 1 ? "message is" : "messages are"} also shown above.`;
      decisionsNote.hidden = false;
    }
    if (pulseBrief.mentionShownElsewhere > 0) {
      mentionsNote.textContent = `${pulseBrief.mentionShownElsewhere} mention ` +
        `${pulseBrief.mentionShownElsewhere === 1 ? "message is" : "messages are"} also shown above.`;
      mentionsNote.hidden = false;
    }

    remainingCount.textContent = pulseBrief.remaining.length > 0
      ? `(${pulseBrief.remaining.length})`
      : "";

    transcriptList.replaceChildren();
    for (const message of messages) {
      appendMessageCard(transcriptList, { message, labels: [], evidence: [] }, false);
    }
    transcriptCount.textContent = `${messages.length} ${messages.length === 1 ? "message" : "messages"}`;
    brief.hidden = false;
  }

  function analyzeText(text, source) {
    try {
      const messages = MissedItParser.parseWhatsAppExport(text);
      const analysis = MissedItAnalyzer.analyzeMessages(messages);
      const pulseBrief = MissedItAnalyzer.createPulseBrief(analysis);
      renderBrief(messages, analysis, pulseBrief, source);
      setStatus("Pulse Brief ready. Your conversation was not uploaded or saved.");
    } catch (error) {
      clearBrief();
      if (error instanceof MissedItParser.ChatParseError) {
        setStatus(error.message, "error");
      } else {
        setStatus("The conversation could not be analyzed. Please check the text and try again.", "error");
        console.error("ThreadPulse could not analyze the conversation.", error);
      }
    }
  }

  async function handleFileSelection() {
    const file = fileInput.files && fileInput.files[0];
    fileInput.value = "";
    const version = ++processingVersion;
    clearBrief();
    status.removeAttribute("data-kind");

    if (!file) {
      fileName.textContent = "No file selected";
      setStatus("Choose a WhatsApp .txt export or .zip archive. It will be processed on this device.");
      return;
    }

    fileName.textContent = file.name;
    const extension = file.name.toLowerCase().split(".").pop();
    if (extension !== "txt" && extension !== "zip") {
      setStatus("Please choose a WhatsApp text export (.txt) or ZIP archive (.zip).", "error");
      return;
    }

    setStatus("Reading and analyzing locally…");
    try {
      if (extension === "zip") {
        const extracted = ThreadPulseZipImport.extractWhatsAppChat(new Uint8Array(await file.arrayBuffer()));
        if (version !== processingVersion || activeMode !== "import") {
          return;
        }
        const selectionNote = extracted.textFileCount > 1
          ? `Selected ${extracted.path} from ${extracted.textFileCount} .txt files (${extracted.selectionReason}).`
          : `Extracted ${extracted.path} from the ZIP.`;
        analyzeText(extracted.text, {
          kind: `ZIP import · ${selectionNote}`,
          label: file.name
        });
      } else {
        const text = await file.text();
        if (version !== processingVersion || activeMode !== "import") {
          return;
        }
        analyzeText(text, { kind: "Imported chat", label: file.name });
      }
    } catch (error) {
      if (version !== processingVersion || activeMode !== "import") {
        return;
      }
      clearBrief();
      setStatus(
        error instanceof ThreadPulseZipImport.ZipImportError
          ? error.message
          : "The file could not be read or extracted. Please select a valid .txt or .zip export.",
        "error"
      );
      console.error("ThreadPulse could not read the selected file.", error);
    }
  }

  function handlePaste() {
    processingVersion++;
    clearBrief();
    if (pasteText.value.trim() === "") {
      setStatus("Paste a WhatsApp conversation before creating a brief.", "error");
      return;
    }

    setStatus("Analyzing pasted conversation locally…");
    analyzeText(pasteText.value, { kind: "Pasted conversation", label: "Pasted chat" });
  }

  importMethod.addEventListener("click", () => setMode("import"));
  pasteMethod.addEventListener("click", () => setMode("paste"));
  fileInput.addEventListener("change", handleFileSelection);
  processPaste.addEventListener("click", handlePaste);
  themeToggle.addEventListener("click", () => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true);
  });
  setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light", false);
})();
