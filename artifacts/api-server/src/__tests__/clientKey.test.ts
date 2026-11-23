import { test } from "node:test";
import assert from "node:assert/strict";
import { clientAddressFrom, hashClientKey } from "../lib/clientKey";

test("reads the client address counting trusted proxies from the right", () => {
  const headers = { "x-forwarded-for": "203.0.113.7, 34.111.179.208" };
  assert.equal(clientAddressFrom(headers, "10.0.0.1", 2), "203.0.113.7");
  assert.equal(clientAddressFrom(headers, "10.0.0.1", 1), "34.111.179.208");
});

test("addresses a visitor adds at the start of X-Forwarded-For are ignored", () => {
  const a = clientAddressFrom({ "x-forwarded-for": "1.1.1.1, 203.0.113.7, 34.111.179.208" }, undefined, 2);
  const b = clientAddressFrom({ "x-forwarded-for": "9.9.9.9, 8.8.8.8, 203.0.113.7, 34.111.179.208" }, undefined, 2);
  assert.equal(a, "203.0.113.7");
  assert.equal(b, "203.0.113.7");
});

test("too many configured hops falls back safely to the leftmost entry", () => {
  assert.equal(clientAddressFrom({ "x-forwarded-for": "203.0.113.7" }, undefined, 3), "203.0.113.7");
});

test("falls back to the socket address when no forwarding header exists", () => {
  assert.equal(clientAddressFrom({}, "127.0.0.1", 2), "127.0.0.1");
});

test("client keys are stable, distinct and never contain the raw address", () => {
  const key = hashClientKey("203.0.113.7");
  assert.equal(key, hashClientKey("203.0.113.7"));
  assert.notEqual(key, hashClientKey("203.0.113.8"));
  assert.ok(!key.includes("203.0.113.7"));
  assert.match(key, /^[0-9a-f]{32}$/);
});
