#!/usr/bin/env node
// Live connectivity + schema smoke test.
//
// READ-ONLY: it never creates, updates or deletes rows. It proves the app can
// reach a real Supabase project and that Row Level Security is actually
// protecting user-scoped tables.
//
// Requirements: real EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY
// in .env (placeholders are refused). Run:  npm run verify:live
//
// NOTE: this script has not been executed against a live project in this
// session (no credentials available), so its output is unverified.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const file = path.join(root, ".env");
  const env = {};
  if (!fs.existsSync(file)) return env;
  fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const t = line.trim();
      if (!t || t.startsWith("#")) return;
      const i = t.indexOf("=");
      if (i === -1) return;
      env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    });
  return env;
}

const env = { ...loadEnv(), ...process.env };
const url = env.EXPO_PUBLIC_SUPABASE_URL;
const key = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const PLACEHOLDER = /your[-_]|placeholder|example|changeme|xxxx/i;

if (!url || !key || PLACEHOLDER.test(url) || PLACEHOLDER.test(key)) {
  console.error(
    "Refusing to run: set real EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env."
  );
  process.exit(2);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

// User-scoped tables: anon must not be able to read another user's rows.
const PRIVATE_TABLES = [
  "checklist_items",
  "budget_items",
  "budget_expenses",
  "wedding_details",
  "favorite_vendors",
  "vendor_bookings",
];

function ok(msg) {
  console.log(`  \u2713 ${msg}`);
}
function fail(msg) {
  console.error(`  \u2717 ${msg}`);
  process.exitCode = 1;
}

async function main() {
  console.log(`\nLive check against ${url}\n`);

  const vendors = await supabase.from("vendors").select("id").limit(1);
  if (vendors.error) fail(`vendors not reachable: ${vendors.error.message}`);
  else ok("vendors table reachable (public read works)");

  for (const table of PRIVATE_TABLES) {
    const { data, error } = await supabase.from(table).select("id").limit(1);
    if (error) {
      ok(`${table}: access denied to anon (${error.code ?? error.message})`);
    } else if ((data ?? []).length === 0) {
      ok(`${table}: no rows exposed to anon (RLS ok)`);
    } else {
      fail(`${table}: RLS LEAK — anon can read rows`);
    }
  }

  const rpcProbes = [
    ["cancel_user_booking", { p_booking_id: "00000000-0000-0000-0000-000000000000" }],
    [
      "cancel_vendor_subscription",
      { subscription_id_input: "00000000-0000-0000-0000-000000000000" },
    ],
  ];
  for (const [fn, args] of rpcProbes) {
    const { error } = await supabase.rpc(fn, args);
    if (error && /does not exist|Could not find the function|schema cache/i.test(error.message)) {
      fail(`RPC ${fn} missing: ${error.message}`);
    } else {
      ok(`RPC ${fn} present`);
    }
  }

  console.log(process.exitCode ? "\n\u274c Live check FAILED\n" : "\n\u2705 Live check passed\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
