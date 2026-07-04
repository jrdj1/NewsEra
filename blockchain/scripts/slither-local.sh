#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
npx hardhat compile
slither . --exclude-dependencies --fail-high
