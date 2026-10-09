"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
require("./analyzer.js");

const { analyzeMessages } = globalThis.MissedItAnalyzer;

function message(sender, content, timestamp = "09/10/26, 13:05") {
  return { timestamp, sender, content };
}

test("detects action, deadline, decision, urgency, and mention candidates", () => {
  const input = [
    message("Rachana", "Please send the report by 10/10/2026 at 5 PM. This is urgent; @Dev can help.")
  ];
  const result = analyzeMessages(input);

  assert.equal(result.categories.actions.length, 1);
  assert.equal(result.categories.deadlines.length, 1);
  assert.deepEqual(result.categories.deadlines[0].evidence, ["by 10/10/2026 at 5 PM"]);
  assert.equal(result.categories.urgent.length, 1);
  assert.equal(result.categories.mentions.length, 1);
  assert.equal(result.categories.mentions[0].evidence[0], "@Dev");
  assert.equal(result.categories.decisions.length, 0);
  assert.equal(result.priorities.length, 1);
  assert.deepEqual(result.priorities[0].categories, ["urgent", "deadlines", "actions", "mentions"]);
  assert.deepEqual(result.priorities[0].message, input[0]);
});

test("recognizes explicit relative date and 24-hour deadline patterns without normalizing them", () => {
  const result = analyzeMessages([
    message("Dev", "Complete this by tomorrow at 17:30."),
    message("Alex", "Submit the form due on Oct 12, 2026.")
  ]);

  assert.equal(result.categories.deadlines.length, 2);
  assert.equal(result.categories.deadlines[0].evidence[0], "by tomorrow at 17:30");
  assert.equal(result.categories.deadlines[1].evidence[0], "due on Oct 12, 2026");
  assert.match(result.categories.deadlines[0].message.content, /tomorrow at 17:30/);
});

test("detects decision wording", () => {
  const result = analyzeMessages([
    message("Sam", "We agreed to meet Friday and finalized the agenda.")
  ]);
  assert.equal(result.categories.decisions.length, 1);
  assert.deepEqual(result.categories.decisions[0].evidence, ["agreed", "finalized"]);
});

test("recognizes deadline labels and explicit by-today urgency", () => {
  const result = analyzeMessages([
    message("Lee", "Deadline: Friday. This is important — submit by today.")
  ]);
  assert.deepEqual(result.categories.deadlines[0].evidence, ["Deadline: Friday", "by today"]);
  assert.deepEqual(result.categories.urgent[0].evidence, ["important", "by today"]);
});

test("orders urgency and deadlines ahead of ordinary candidate messages", () => {
  const result = analyzeMessages([
    message("A", "We agreed on the plan."),
    message("B", "Please submit the form."),
    message("C", "This is important."),
    message("D", "Pay by Friday.")
  ]);
  assert.deepEqual(
    result.priorities.map(item => item.message.sender),
    ["C", "D", "B", "A"]
  );
  assert.equal(result.keyMessages.length, 3);
});

test("returns useful local statistics and explicit empty candidate state", () => {
  const result = analyzeMessages([
    message("A", "Good morning."),
    message("B", "Thanks.")
  ]);
  assert.equal(result.messageCount, 2);
  assert.equal(result.participantCount, 2);
  assert.equal(result.hasCandidates, false);
  assert.equal(result.priorities.length, 0);
  assert.match(result.overview, /2 messages from 2 participants/);
  assert.match(result.overview, /No candidate/);
});

test("rejects message records missing required string fields", () => {
  assert.throws(() => analyzeMessages([{ sender: "A", content: "Hello" }]), TypeError);
});
