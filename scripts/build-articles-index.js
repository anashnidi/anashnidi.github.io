#!/usr/bin/env node
// Rebuilds content/articles/index.json from the frontmatter of every
// content/articles/*.md file. Run by .github/workflows/build-articles-index.yml
// on every push that touches content/articles/**.md, and safe to run locally.
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const DIR = path.join(__dirname, "..", "content", "articles");

const files = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith(".md"));

const articles = files
  .map((f) => {
    const raw = fs.readFileSync(path.join(DIR, f), "utf8");
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!m) {
      console.warn(`skipping ${f}: no frontmatter found`);
      return null;
    }
    let data;
    try {
      data = yaml.load(m[1]);
    } catch (e) {
      console.warn(`skipping ${f}: YAML parse error: ${e.message}`);
      return null;
    }
    return {
      slug: f.replace(/\.md$/, ""),
      title_en: data.title_en || "",
      title_ar: data.title_ar || "",
      excerpt_en: data.excerpt_en || "",
      excerpt_ar: data.excerpt_ar || "",
      tag: data.tag || "",
      date: data.date ? String(data.date).slice(0, 10) : "",
      featured: !!data.featured,
      external_linkedin: data.external_linkedin || "",
      external_substack: data.external_substack || "",
    };
  })
  .filter(Boolean);

articles.sort((a, b) => new Date(b.date) - new Date(a.date));

const outPath = path.join(DIR, "index.json");
fs.writeFileSync(outPath, JSON.stringify(articles, null, 2) + "\n");
console.log(`Built ${outPath} with ${articles.length} articles.`);
