# Development prompts

This file records the user-provided prompts used for the MissedIt MVP. It does not claim that an AI model, API, or automated analysis was used by the application.

## Prompt 1 — proposal

> **Official Problem Statement — The Unread Problem: "What Did I Miss?"**
> Build a simple AI micro-app that helps users quickly understand and prioritize important information from overwhelming chat conversations.
>
> The solution should focus on:
>
> - Summarizing long and unread conversations.
> - Identifying important messages, decisions, and action items.
> - Prioritizing information based on urgency and relevance.
> - Highlighting mentions, deadlines, and tasks the user may have missed.
> - Using local-first processing to ensure conversations, data, and summaries never leave the user's device.
>
> **Project: MissedIt — "What Did I Miss?"**
> We are building this project under severe time constraints for a hackathon. The goal is a working, demonstrable MVP, not a feature-rich product.
>
> ### Requirements
>
> - Allow users to import exported chat text files from different messaging platforms.
> - Start with one supported export format, then add another only if time permits.
> - Convert platform-specific messages into a common internal format: timestamp, sender, and message content.
> - Display a concise summary and highlight likely action items, deadlines, decisions, mentions, and urgent messages.
> - Process uploaded files and analyze conversations entirely in the browser. Do not send chat content to a backend or external AI API.
> - Use plain HTML, CSS, and JavaScript unless there is a strong reason otherwise.
> - Handle malformed or unsupported files clearly.
> - Keep the implementation simple, reliable, accessible, and deployable.
>
> ### Before coding
> Do not implement anything yet. Propose:
>
> 1. The minimum architecture and required files.
> 2. The best export format to support first and why.
> 3. The implementation order, prioritizing a working end-to-end MVP.
> 4. A realistic deployment approach compatible with browser-only processing.
> 5. Key limitations, privacy considerations, and risks under the time limit.
> Do not invent requirements or add unnecessary features. Prioritize the challenge requirements, verify assumptions, and keep the scope small.

## Prompt 2 — upload-and-parse skeleton

> Implement the first working skeleton of MissedIt using the approved architecture.
>
> Create:
>
> - index.html
> - styles.css
> - app.js
> - parser.js
> - analyzer.js
> - README.md
> - prompt.md
>
> Requirements for this step:
>
> 1. Build a clean, accessible, responsive one-page interface.
> 2. Allow the user to select a WhatsApp-exported .txt file.
> 3. Read the file entirely in the browser using the File API. Never send its contents to a server or external API.
> 4. Parse a supported WhatsApp text format into messages containing timestamp, sender, and content. Support multiline messages where feasible.
> 5. Display parsed messages and a message count so we can verify the upload-to-display flow.
> 6. Handle empty files, invalid files, and unsupported formats with clear errors.
> 7. Keep parsed content in memory only. Do not use localStorage, sessionStorage, analytics, or external scripts.
> 8. Keep parser.js separate from analyzer.js. For now, analyzer.js can return a clear placeholder indicating analysis is not implemented yet.
> 9. Do not add frameworks, dependencies, authentication, a backend, or cloud AI.
> 10. Create prompt.md to record the actual development prompts used. Do not invent or claim prompts were used if they were not.
> 11. Make the app runnable locally by opening index.html, with no build step.
> Before finishing, test the parsing logic against representative sample messages, including a multiline message, and explain exactly what was tested and what remains untested.
>
> Do not claim that the application is fully AI-powered yet. This step is only the working upload-and-parse skeleton.

## Prompt 3 — parser reliability

> Apply a focused reliability fix to the existing MissedIt project, based on an independent code review.
>
> Before editing, inspect the actual filenames and current implementation. Preserve the existing architecture and working upload/display flow.
>
> Fix these issues in parser.js:
>
> 1. A trailing newline or blank line must not be appended to the previous message as message content.
> 2. System notifications containing colons must not be incorrectly parsed as sender messages. Handle known system-notification patterns conservatively; do not silently discard ordinary user messages.
> 3. Strip leading invisible direction marks such as U+200E before matching message boundaries.
> 4. Track lines that cannot be parsed or classified, and expose a count or warning so the UI does not claim complete parsing when content was skipped.
>
> Add focused parser tests for:
>
> - A normal message with a 12-hour timestamp.
> - A normal message with a 24-hour timestamp.
> - A multiline message.
> - A system notification containing a colon.
> - A file ending with a newline.
> - An invisible direction mark before a message.
> - Empty and unsupported files.
> Also:
>
> - Check that the real filenames match the script and stylesheet references in index.html. Fix mismatches only if they actually exist.
> - Preserve textContent-based rendering; never introduce innerHTML for chat content.
> - Do not add new features, frameworks, AI APIs, or a backend.
> - Do not rewrite unrelated files.
> - Update prompt.md with this actual prompt if it is not already recorded.
> - Run the tests and report the exact results. Do not claim a test passed unless it was actually run.
> Do not implement summaries or action-item detection yet. First make parsing reliable.

## Prompt 4 — local analysis

> Implement the core local analysis features in the existing MissedIt project.
>
> First inspect the current files, especially parser.js, analyzer.js, and app.js. Preserve the working upload, parsing, error handling, and skipped-line warning.
>
> CHALLENGE REQUIREMENTS:
>
> - Summarize long conversations.
> - Identify important messages, decisions, and action items.
> - Prioritize information by urgency and relevance.
> - Highlight mentions, deadlines, and tasks users may have missed.
> - Keep all chat data and analysis on the user's device.
> IMPLEMENT:
>
> 1. A concise conversation overview using local statistics and extracted key messages. Do not pretend this is an LLM-generated semantic summary.
> 2. Candidate action items detected using practical task-related patterns such as "please do", "need to", "don't forget", "send", "submit", and "complete".
> 3. Candidate deadlines by recognizing common explicit date and time patterns. Preserve the original text and do not guess ambiguous dates.
> 4. Important decisions using patterns such as "decided", "agreed", "confirmed", and "finalized".
> 5. Urgency signals using explicit words such as "urgent", "ASAP", "important", and "by today".
> 6. Direct mentions when a message contains an @mention.
> 7. A simple priority ordering that places explicit urgency and deadlines ahead of ordinary messages.
> IMPLEMENTATION RULES:
>
> - Keep analyzer.js separate from parser.js.
> - Use only browser-side JavaScript. No backend, external AI API, network requests, storage, or new dependencies.
> - Treat all detections as candidates, not guaranteed facts.
> - Preserve original message text and sender information for every result.
> - Render all chat-derived content safely using textContent and DOM methods; never insert it through innerHTML.
> - Show a clear empty state when no candidates are detected.
> - Keep the UI readable and usable on a laptop and smaller screens.
> - Do not break the existing upload flow or parser tests.
> - Add focused tests for the analysis rules where practical.
> - Update README.md with supported analysis behavior and limitations.
> - Add this actual prompt to prompt.md.
> After implementation, run the parser and analysis tests. Report exact test results, changed files, and anything not tested. Do not claim genuine AI summarization or perfect deadline detection.
>
> Do not add unrelated features or redesign the entire application.
