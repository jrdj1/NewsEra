#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
npx hardhat compile
slither contracts/ --exclude-dependencies --fail-high
