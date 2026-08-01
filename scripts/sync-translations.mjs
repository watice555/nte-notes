import { readFile, writeFile } from "node:fs/promises";

const STATIC_BASE_URL = "https://static.nanoka.cc";
const TRANSLATIONS_PATH = new URL("../src/data/translations.json", import.meta.url);
const SYNCED_CATEGORIES = new Set(["角色", "武器", "怪物"]);
const CATEGORY_ORDER = new Map([
  ["游戏名", 0],
  ["世界观", 1],
  ["角色", 2],
  ["属性", 3],
  ["弧盘类别", 4],
  ["武器", 5],
  ["怪物", 6],
]);

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makeEntries(records, category) {
  const seenPairs = new Set();

  return Object.values(records)
    .filter((record) => typeof record.zh === "string" && typeof record.en === "string")
    .filter((record) => record.zh.length > 0 && record.en.length > 0)
    .filter((record) => {
      const pair = `${record.zh}\u0000${record.en}`;
      if (seenPairs.has(pair)) return false;
      seenPairs.add(pair);
      return true;
    })
    .map((record) => {
      return {
        id: `${category === "角色" ? "character" : category === "武器" ? "weapon" : "monster"}-${slugify(record.id)}`,
        zh: record.zh,
        en: record.en,
        category,
        aliases: [],
        note: {
          zh: "",
          en: "",
        },
      };
    })
    .sort((a, b) => a.zh.localeCompare(b.zh, "zh-CN"));
}

const manifest = await fetchJson(`${STATIC_BASE_URL}/manifest.json`);
const version = process.argv[2] ?? manifest.nte?.latest;

if (!version) {
  throw new Error("NTE data version is missing from the manifest.");
}

const dataBaseUrl = `${STATIC_BASE_URL}/nte/${version}`;
const [characters, weapons, monsters, existing] = await Promise.all([
  fetchJson(`${dataBaseUrl}/character.json`),
  fetchJson(`${dataBaseUrl}/weapon.json`),
  fetchJson(`${dataBaseUrl}/monster.json`),
  readFile(TRANSLATIONS_PATH, "utf8").then(JSON.parse),
]);

const generated = [
  ...makeEntries(characters, "角色"),
  ...makeEntries(weapons, "武器"),
  ...makeEntries(monsters, "怪物"),
];
const preserved = existing.filter((entry) => !SYNCED_CATEGORIES.has(entry.category));
const translations = [...preserved, ...generated].map((entry) => ({
  ...entry,
  aliases: [],
  note: {
    zh: "",
    en: "",
  },
})).sort((a, b) => {
  const categoryDifference =
    (CATEGORY_ORDER.get(a.category) ?? Number.MAX_SAFE_INTEGER) -
    (CATEGORY_ORDER.get(b.category) ?? Number.MAX_SAFE_INTEGER);

  return categoryDifference || a.zh.localeCompare(b.zh, "zh-CN");
});
const ids = translations.map((entry) => entry.id);

if (new Set(ids).size !== ids.length) {
  throw new Error("Generated translation IDs are not unique.");
}

const serialized = `${JSON.stringify(translations, null, 2)}\n`.replace(
  /\[\n\s+"([^"\n]*)"\n\s+\]/g,
  '["$1"]',
);

await writeFile(TRANSLATIONS_PATH, serialized);

const counts = Object.fromEntries(
  ["角色", "武器", "怪物"].map((category) => [
    category,
    translations.filter((entry) => entry.category === category).length,
  ]),
);

console.log(`Updated translations from NTE ${version}:`, counts);
