#!/usr/bin/env bash
find ./src/main/javascript -name "*.bench.ts" | while read -r FILE; do
  echo "$FILE"
  ts-node "$FILE"
done