import { describe, expect, it } from "vitest";
import { findErrorLocation, languageTag, relativeTime } from "@/lib/utils";

describe("findErrorLocation", () => {
  it("uses the last frame of a Python traceback (most recent call last)", () => {
    const trace = `Traceback (most recent call last):
  File "/srv/app/main.py", line 10, in <module>
    run()
  File "/srv/app/orders.py", line 42, in create_order
    total = item["price"]
KeyError: 'price'`;
    expect(findErrorLocation(trace)).toEqual({ file: "orders.py", line: 42, traceLine: 3 });
  });

  it("picks the user's JSX frame over React internals", () => {
    const trace = `TypeError: Cannot read properties of undefined (reading 'map')
    at UserList (webpack-internal:///./src/components/UserList.jsx:12:23)
    at renderWithHooks (react-dom.development.js:16305:18)`;
    expect(findErrorLocation(trace)).toEqual({ file: "UserList.jsx", line: 12, traceLine: 1 });
  });

  it("skips node_modules frames in Node.js traces", () => {
    const trace = `Error: connect ECONNREFUSED 127.0.0.1:5432
    at TCPConnectWrap.afterConnect (node:net:1555:16)
    at Client.connect (/app/node_modules/pg/lib/client.js:132:14)
    at main (/app/src/db.ts:8:3)`;
    expect(findErrorLocation(trace)).toMatchObject({ file: "db.ts", line: 8, traceLine: 3 });
  });

  it.each([
    ["Java", `java.lang.NullPointerException\n\tat com.shop.Validator.isValid(Validator.java:17)`, "Validator.java", 17],
    ["Kotlin", `kotlin.UninitializedPropertyAccessException\n\tat app.Main.run(Main.kt:9)`, "Main.kt", 9],
    ["C#", `System.InvalidOperationException\n   at Shop.OrderService.Get() in C:\\src\\OrderService.cs:line 31`, "OrderService.cs", 31],
    ["Go", `panic: runtime error: index out of range\n\nmain.lastItem(...)\n\t/home/dev/app/main.go:14`, "main.go", 14],
    ["Rust", `thread 'main' panicked at src/main.rs:8:37:\ncalled \`Result::unwrap()\``, "main.rs", 8],
    ["Ruby", `NoMethodError: undefined method 'upcase' for nil\n  app/models/user.rb:12:in 'display_name'`, "user.rb", 12],
    ["PHP", `PHP Fatal error:  Uncaught Error: Call to a member function fetch() on bool in /var/www/db.php:23`, "db.php", 23],
  ])("parses %s frames", (_name, trace, file, line) => {
    expect(findErrorLocation(trace)).toMatchObject({ file, line });
  });

  it("falls back to a generic 'line N' mention without a file", () => {
    expect(findErrorLocation("SyntaxError: unexpected token on line 7")).toEqual({ file: null, line: 7, traceLine: 0 });
  });

  it("returns null when the trace has no location", () => {
    expect(findErrorLocation("Segmentation fault (core dumped)")).toBeNull();
  });
});

describe("languageTag", () => {
  it("abbreviates known languages without ambiguity", () => {
    expect(languageTag("JavaScript")).toBe("JS");
    expect(languageTag("Java")).toBe("JAVA");
    expect(languageTag("TypeScript")).toBe("TS");
    expect(languageTag("C#")).toBe("C#");
  });

  it("falls back to the first four letters for unknown languages", () => {
    expect(languageTag("Elixir")).toBe("ELIX");
  });
});

describe("relativeTime", () => {
  const now = Date.UTC(2026, 0, 10, 12, 0, 0);
  const ago = (ms: number) => relativeTime(now - ms, now);

  it("formats recent and older timestamps", () => {
    expect(ago(30_000)).toBe("just now");
    expect(ago(5 * 60_000)).toBe("5m ago");
    expect(ago(3 * 3_600_000)).toBe("3h ago");
    expect(ago(30 * 3_600_000)).toBe("yesterday");
    expect(ago(4 * 86_400_000)).toBe("4d ago");
  });
});
