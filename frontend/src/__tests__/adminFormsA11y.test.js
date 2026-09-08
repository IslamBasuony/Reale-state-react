import fs from "fs";
import path from "path";

const FORM_PAGES = [
  "AdminPropertyForm.jsx",
  "AdminAgentForm.jsx",
  "AdminClientDetail.jsx",
  "AdminSettings.jsx",
  "AdminAuditLogs.jsx",
];

const readSource = (file) =>
  fs.readFileSync(path.join(__dirname, "..", "admin", "pages", file), "utf8");

describe.each(FORM_PAGES)("admin form label association (%s)", (file) => {
  const src = readSource(file);

  const htmlFors = [...src.matchAll(/htmlFor="([^"]+)"/g)].map((m) => m[1]);
  const ids = [...src.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  const hintIds = new Set([...src.matchAll(/aria-describedby="([^"]+)"/g)].map((m) => m[1]));

  it("has no duplicate id attributes", () => {
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates).toEqual([]);
  });

  it("links every htmlFor to a real id in the same file", () => {
    const orphans = htmlFors.filter((id) => !ids.includes(id));
    expect(orphans).toEqual([]);
  });

  it("keeps every id referenced exactly once (except aria-describedby targets)", () => {
    const controlIds = ids.filter((id) => !hintIds.has(id));
    const byRef = (id) =>
      htmlFors.filter((h) => h === id).length +
      [...src.matchAll(/for={?["'`]([^"'`]+)/g)].filter((m) => m[1] === id).length;
    const overReferenced = controlIds.filter((id) => byRef(id) > 1);
    expect(overReferenced).toEqual([]);
  });

  it("does not rely on bare <label> next to its control (htmlFor or wrapping)", () => {
    const bareLabels = [...src.matchAll(/<label(?![^>]*htmlFor=)[^>]*>(?![\s\S]*?<\/label>)/g)].length;
    const wrappingLabels = [...src.matchAll(/<label(?![^>]*htmlFor=)[^>]*>/g)];
    expect(bareLabels).toBe(0);
    // any remaining non-htmlFor labels must wrap their own control
    for (const m of wrappingLabels) {
      const openIndex = m.index;
      const labelBlock = src.slice(openIndex, src.indexOf("</label>", openIndex));
      const afterOpenTag = labelBlock.slice(m[0].length);
      expect(/<(input|select|textarea)\b/.test(labelBlock)).toBe(true);
      expect(afterOpenTag.includes("<label")).toBe(false);
    }
  });
});