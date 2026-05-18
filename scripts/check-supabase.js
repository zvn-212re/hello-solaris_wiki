const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const ENV_FILES = [".env.local", ".env"];
const REQUIRED = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

function loadEnvFile(file) {
  const fullPath = path.join(ROOT, file);

  if (!fs.existsSync(fullPath)) {
    return;
  }

  for (const rawLine of fs.readFileSync(fullPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const name = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, "");

    if (name && process.env[name] === undefined) {
      process.env[name] = value;
    }
  }
}

function getConfig() {
  for (const file of ENV_FILES) {
    loadEnvFile(file);
  }

  const missing = REQUIRED.filter((name) => !process.env[name]);

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return {
    url: process.env.SUPABASE_URL.replace(/\/$/, ""),
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    guestbookTable: process.env.SOLARIS_GUESTBOOK_TABLE || "guestbook_messages",
    submissionsTable: process.env.SOLARIS_SUBMISSIONS_TABLE || "content_submissions",
  };
}

async function checkTable(config, table) {
  const response = await fetch(`${config.url}/rest/v1/${table}?select=id&limit=1`, {
    headers: {
      apikey: config.key,
      authorization: `Bearer ${config.key}`,
    },
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${table}: ${response.status} ${text || response.statusText}`);
  }

  return table;
}

async function main() {
  const config = getConfig();
  const tables = [config.guestbookTable, config.submissionsTable];
  const checked = [];

  for (const table of tables) {
    checked.push(await checkTable(config, table));
  }

  console.log(`Supabase OK: ${checked.join(", ")}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
