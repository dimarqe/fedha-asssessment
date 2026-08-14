/**
 * Minimal JSON-file persistence for applications.
 *
 * Deliberately simple for the scope of this assessment: a single JSON file,
 * loaded at startup and rewritten atomically on every mutation. Fine for one
 * process and small data volumes; DECISIONS.md covers what I'd use in production.
 */

import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { seedApplications } from './seed.js';

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const DATA_FILE = join(DATA_DIR, 'applications.json');

let applications = null;

function load() {
  if (applications !== null) return;
  if (existsSync(DATA_FILE)) {
    applications = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
    return;
  }
  // A fresh store (including every deploy, since the host's disk is ephemeral)
  // starts with demo data so there is something to review straight away.
  applications = process.env.SEED_DEMO_DATA === 'false' ? [] : seedApplications();
  persist();
}

function persist() {
  mkdirSync(DATA_DIR, { recursive: true });
  // Write to a temp file then rename, so a crash mid-write can't corrupt the store.
  const tmp = DATA_FILE + '.tmp';
  writeFileSync(tmp, JSON.stringify(applications, null, 2), 'utf8');
  renameSync(tmp, DATA_FILE);
}

export function listApplications() {
  load();
  return [...applications];
}

export function getApplication(id) {
  load();
  return applications.find((a) => a.id === id) ?? null;
}

export function addApplication(record) {
  load();
  const withId = { id: randomUUID(), submittedAt: new Date().toISOString(), ...record };
  applications.push(withId);
  persist();
  return withId;
}
