#!/usr/bin/env node
// Genera docs/metricas.json agregando datos de gas, cobertura y tests.
// Si algún archivo fuente no existe, el campo correspondiente es null.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function readJson(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

// ── Fuentes ───────────────────────────────────────────────────────────────────

const deployments = readJson(join(root, "blockchain/deployments/sepolia.json"));
const gasReport   = readJson(join(root, "blockchain/gas-report.json"));
const coverage    = readJson(join(root, "blockchain/coverage/coverage-summary.json"));
const testResults = readJson(join(root, "blockchain/test-results.json"));

// ── Addresses ─────────────────────────────────────────────────────────────────

const addresses = {
  PublicationRegistry: deployments?.PublicationRegistry ?? null,
  ValidationRegistry:  deployments?.ValidationRegistry  ?? null,
  ReputationSystem:    deployments?.ReputationSystem     ?? null,
};

const bloqueDespliegue = deployments?.blockNumber ?? null;

// ── Gas ───────────────────────────────────────────────────────────────────────

function extractGas(report, fnName) {
  if (!report) return null;
  // hardhat-gas-reporter emite un array de filas con { contract, method, avg }
  const row = report.find?.((r) => r.method === fnName || r.function === fnName);
  return row?.avg ?? row?.mean ?? null;
}

const gasValues = {
  registerPublication: extractGas(gasReport, "registerPublication"),
  submitValidation:    extractGas(gasReport, "submitValidation"),
  increaseReputation:  extractGas(gasReport, "increaseReputation"),
  decreaseReputation:  extractGas(gasReport, "decreaseReputation"),
};

const gasNonNull = Object.values(gasValues).filter((v) => v !== null);
gasValues.media = gasNonNull.length
  ? Math.round(gasNonNull.reduce((a, b) => a + b, 0) / gasNonNull.length)
  : null;

// ── Cobertura ─────────────────────────────────────────────────────────────────

// coverage-summary.json de istanbul tiene la clave "total" con { statements: { pct } }
const coberturaTotal =
  coverage?.total?.statements?.pct ?? coverage?.total?.lines?.pct ?? null;

// ── Tests ─────────────────────────────────────────────────────────────────────

const tests = {
  pasados: testResults?.passed ?? null,
  totales: testResults?.total  ?? null,
};

// ── LOC (opcional — requiere cloc instalado) ──────────────────────────────────

const loc = {
  solidity: null,
  backend:  null,
  frontend: null,
};

// ── Sprint actual ─────────────────────────────────────────────────────────────

// Lee desde deployments si existe, si no usa un valor base
const sprintActual = deployments?.sprint ?? "Sprint 1";

// ── Output ────────────────────────────────────────────────────────────────────

const fecha = new Date().toISOString().slice(0, 10);

const metricas = {
  fecha,
  red: "Sepolia",
  sprint: sprintActual,
  bloque_despliegue: bloqueDespliegue,
  contratos: {
    addresses,
    gas: gasValues,
    cobertura: coberturaTotal,
  },
  tests,
  loc,
};

const outPath = join(root, "docs/metricas.json");
writeFileSync(outPath, JSON.stringify(metricas, null, 2) + "\n", "utf-8");
console.log(`metricas.json generado → ${outPath}`);
