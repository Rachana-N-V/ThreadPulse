# ThreadPulse

ThreadPulse is a browser-only chat import and local-analysis MVP built around **Pulse Brief: one conversation in, one concise briefing out.** It uses transparent text-pattern candidates and local message statistics; it does not create a generative AI summary or understand conversation context.

## Run locally

Open `index.html` in a modern browser. Choose **Import chat** for a WhatsApp `.txt` export or **Paste conversation** to enter exported chat text. Both methods use the same parser and local analysis. No build step, server, or dependency installation is required.

The brief shows message and flagged-message counts, up to five highest-priority unique messages, up to five decision and mention messages, then disclosures for remaining flagged messages and the full transcript. Categories for a message shown earlier are combined as labels on that card rather than rendered as duplicate message cards.

## Supported export format

The parser recognizes dated message lines in this form:

```text
DD/MM/YY, HH:MM - Sender: Message text
```

It also accepts a four-digit year, optional seconds or AM/PM, and the common bracketed form:

```text
[DD/MM/YYYY, HH:MM:SS] Sender: Message text
```

Lines following a recognized message are appended to that message until the next recognized timestamp. Trailing blank lines are ignored. Known WhatsApp group/system notifications are skipped; unrecognized nonblank lines are counted and reported. Date interpretation is not normalized: the timestamp is displayed as written. Locale-specific date formats, messages whose sender portion has no colon, and other platforms' exports may not be recognized.

## Local analysis

- The overview reports parsed message and participant counts, candidate counts, and up to five messages in existing heuristic priority order.
- Candidate action items are identified with wording such as “please do,” “need to,” “don't forget,” “send,” “submit,” and “complete.”
- Candidate deadlines are detected from explicit cue phrases and common date/time forms, including numeric dates, month-name dates, weekdays, relative words such as “today” and “tomorrow,” and 12-/24-hour times. Matched date text is preserved as written; dates are not normalized or inferred.
- Decision wording includes “decided,” “agreed,” “confirmed,” and “finalized.”
- Explicit urgency wording includes “urgent,” “ASAP,” “important,” and “by today.”
- Direct mentions use `@name`-style tokens.
- Messages that match several rules are grouped into one card with combined labels and original matched wording. The needs-attention, decisions, mentions, and remaining-flagged areas partition those unique flagged messages.

All results are heuristic candidates. False positives and missed paraphrases are expected; a date may be ambiguous across locales, and the app deliberately does not guess its meaning. Counts and candidate ordering are not a semantic assessment of importance. This is not genuine AI summarization and does not guarantee detection of every task or deadline.

## Privacy

Imported and pasted chat text is parsed and analyzed in page memory using browser-side JavaScript and is not uploaded or intentionally saved. The app has no backend, external AI API, analytics, or external scripts. The selected light/dark theme preference is the only value stored locally, in `localStorage`. Browsers may restore form contents in some circumstances, so pasted text may reappear after closing or reloading the page.
