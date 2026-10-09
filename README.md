# MissedIt

MissedIt is a browser-only chat import and local-analysis MVP for the “What did I miss?” challenge. It reads WhatsApp `.txt` exports, displays parsed messages, and reports pattern-based candidate highlights. Its overview uses local statistics and extracted messages; it is not an AI-generated semantic summary.

## Run locally

Open `index.html` in a modern browser and choose a WhatsApp-exported `.txt` file. No build step, web server, or dependency installation is required.

## Supported export format

The parser recognizes dated message lines in this form:

```text
DD/MM/YY, HH:MM - Sender: Message text
```

It also accepts a four-digit year, optional seconds or AM/PM, and the common bracketed form:

```text
[DD/MM/YYYY, HH:MM:SS] Sender: Message text
```

Lines following a recognized message are appended to that message until the next recognized timestamp. Trailing blank lines are ignored. Known WhatsApp group/system notifications are skipped; unrecognized nonblank lines are counted and reported rather than silently treated as parsed messages. Date interpretation is not normalized: the timestamp is displayed as written. Locale-specific date formats, messages whose sender portion has no colon, and other platforms' exports may not be recognized. If no supported message is found, the app reports that the format is unsupported.

## Privacy

The file is read with the browser File API and parsed in page memory. The app has no backend, external AI API, analytics, external scripts, or browser storage. It does not save the file or parsed conversation; closing or reloading the page discards the in-memory data.

## Local analysis

- The overview reports parsed message and participant counts, candidate counts, and a short list of prioritized original messages.
- Candidate action items are identified with wording such as “please do,” “need to,” “don't forget,” “send,” “submit,” and “complete.”
- Candidate deadlines are detected from explicit cue phrases and common date/time forms, including numeric dates, month-name dates, weekdays, relative words such as “today” and “tomorrow,” and 12-/24-hour times. Matched date text is preserved as written; dates are not normalized or inferred.
- Decision wording includes “decided,” “agreed,” “confirmed,” and “finalized.”
- Explicit urgency wording includes “urgent,” “ASAP,” “important,” and “by today.”
- Direct mentions use `@name`-style tokens.
- Priorities place explicit urgency first, then deadlines, then action items, decisions, and mentions. Each candidate retains its original sender, timestamp, and complete message.

All results are heuristic candidates based on text patterns. False positives and missed paraphrases are expected; a date may be ambiguous across locales, and the app deliberately does not guess its meaning. Counts and candidate ordering are not a semantic assessment of importance. This is not genuine AI summarization and does not guarantee detection of every task or deadline.

## Current limitations

- Only the documented WhatsApp text patterns are supported.
- Parsing is intentionally lightweight and cannot reliably interpret every WhatsApp locale, system event, or unusual sender/message format.
