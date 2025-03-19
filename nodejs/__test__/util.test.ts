// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: Copyright The LanceDB Authors

import { IntoSql, toSQL, TTLCache } from "../lancedb/util";

test.each([
  ["string", "'string'"],
  [123, "123"],
  [1.11, "1.11"],
  [true, "TRUE"],
  [false, "FALSE"],
  [null, "NULL"],
  [new Date("2021-01-01T00:00:00.000Z"), "'2021-01-01T00:00:00.000Z'"],
  [[1, 2, 3], "[1, 2, 3]"],
  [new ArrayBuffer(8), "X'0000000000000000'"],
  [Buffer.from("hello"), "X'68656c6c6f'"],
  ["Hello 'world'", "'Hello ''world'''"],
  ["", "''"],
  [[], "[]"],
  [[1, "test", true], "[1, 'test', TRUE]"],
  [[[1,2], [3,4]], "[[1, 2], [3, 4]]"],
])("toSQL(%p) === %p", (value, expected) => {
  expect(toSQL(value)).toBe(expected);
});

test("toSQL({}) throws on unsupported value type", () => {
  expect(() => toSQL({} as unknown as IntoSql)).toThrow(
    "Unsupported value type: object value: ([object Object])",
  );
});

test("toSQL() throws on unsupported value type", () => {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  expect(() => (<any>toSQL)()).toThrow(
    "Unsupported value type: undefined value: (undefined)",
  );
});

describe("TTLCache", () => {
  jest.useFakeTimers();

  test("constructor creates empty cache with TTL", () => {
    const cache = new TTLCache(1000);
    expect(cache).toBeDefined();
  });

  test("get returns undefined for non-existing key", () => {
    const cache = new TTLCache(1000);
    expect(cache.get("nonexistent")).toBeUndefined();
  });

  test("set and get work for non-expired entries", () => {
    const cache = new TTLCache(1000);
    cache.set("key", "value");
    expect(cache.get("key")).toBe("value");
  });

  test("get returns undefined for expired entries", () => {
    const cache = new TTLCache(1000);
    cache.set("key", "value");
    jest.advanceTimersByTime(1001);
    expect(cache.get("key")).toBeUndefined();
  });

  test("delete removes entry", () => {
    const cache = new TTLCache(1000);
    cache.set("key", "value");
    cache.delete("key");
    expect(cache.get("key")).toBeUndefined();
  });

  test("set overwrites existing entry", () => {
    const cache = new TTLCache(1000);
    cache.set("key", "value1");
    cache.set("key", "value2");
    expect(cache.get("key")).toBe("value2");
  });

  test("cache can store different value types", () => {
    const cache = new TTLCache(1000);
    cache.set("string", "test");
    cache.set("number", 123);
    cache.set("boolean", true);
    cache.set("object", {test: true});
    cache.set("array", [1,2,3]);

    expect(cache.get("string")).toBe("test");
    expect(cache.get("number")).toBe(123);
    expect(cache.get("boolean")).toBe(true);
    expect(cache.get("object")).toEqual({test: true});
    expect(cache.get("array")).toEqual([1,2,3]);
  });

  test("multiple entries can expire independently", () => {
    const cache = new TTLCache(1000);
    cache.set("key1", "value1");
    jest.advanceTimersByTime(500);
    cache.set("key2", "value2");
    jest.advanceTimersByTime(501);

    expect(cache.get("key1")).toBeUndefined();
    expect(cache.get("key2")).toBe("value2");
  });
});
