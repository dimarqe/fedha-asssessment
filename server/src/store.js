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

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const DATA_FILE = join(DATA_DIR, 'applications.json');

let applications = null;

function load() {
  if (applications !== null) return;
  if (existsSync(DATA_FILE)) {
    applications = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
  } else {
    applications = [];
  }
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

export function updateApplication(id, patch) {
  load();
  const index = applications.findIndex((a) => a.id === id);
  if (index === -1) return null;
  applications[index] = { ...applications[index], ...patch };
  persist();
  return applications[index];
}
