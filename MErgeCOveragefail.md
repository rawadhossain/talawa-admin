Run mkdir -p ./coverage/vitest
  mkdir -p ./coverage/vitest
  
  # Find all coverage directories from shards
  echo "Finding coverage data from shards..."
  SHARD_DIRS=$(find coverage-shards -type d -name "coverage-shard-*" 2>/dev/null || true)
  
  if [ -z "$SHARD_DIRS" ]; then
    echo "ERROR: No shard directories found!"
    ls -la coverage-shards/ || true
    exit 1
  fi
  
  echo "Found shard directories:"
  echo "$SHARD_DIRS"
  
  echo "Using LCOV files for merging..."
  # Find all lcov.info files from shards
  find coverage-shards -name "lcov.info" -type f > lcov-files.txt
  
  if [ ! -s lcov-files.txt ]; then
    echo "ERROR: No lcov.info files found!"
    exit 1
  fi
  
  echo "Found coverage files:"
  cat lcov-files.txt
  
  # Validate each file exists and is not empty (fail-fast)
  while IFS= read -r file; do
    if [ ! -f "$file" ]; then
      echo "ERROR: Coverage file does not exist: $file"
      exit 1
    fi
    if [ ! -s "$file" ]; then
      echo "ERROR: Coverage file is empty: $file"
      exit 1
    fi
  done < lcov-files.txt
  
  # Merge LCOV files - collect all lcov.info files explicitly
  LCOV_FILES=$(tr '\n' ' ' < lcov-files.txt)
  echo "Merging coverage files: $LCOV_FILES"
  pnpm exec lcov-result-merger $LCOV_FILES ./coverage/vitest/lcov.info
  
  # Validate merged file exists and is not empty
  if [ ! -s ./coverage/vitest/lcov.info ]; then
    echo "ERROR: Merged coverage file is empty or missing!"
    exit 1
  fi
  
  echo "Coverage merge successful"
  echo "Merged file size: $(wc -l < ./coverage/vitest/lcov.info) lines"
  
  # Count number of source files in merged coverage
  SF_COUNT=$(grep -c "^SF:" ./coverage/vitest/lcov.info || echo "0")
  echo "Number of files in merged coverage: $SF_COUNT"
  
  if [ "$SF_COUNT" -lt 250 ]; then
    echo "WARNING: Only $SF_COUNT files in coverage (expected 300+)"
    echo "This might indicate incomplete coverage merge"
  fi
  
  echo "First 30 lines of merged coverage:"
  head -30 ./coverage/vitest/lcov.info
  shell: /usr/bin/bash -e {0}
  env:
    CODECOV_UNIQUE_NAME: CODECOV_UNIQUE_NAME-19902697706-12
    PNPM_HOME: /home/runner/setup-pnpm/node_modules/.bin
Finding coverage data from shards...
Found shard directories:
coverage-shards/coverage-shard-11
coverage-shards/coverage-shard-10
coverage-shards/coverage-shard-1
coverage-shards/coverage-shard-9
coverage-shards/coverage-shard-5
coverage-shards/coverage-shard-6
coverage-shards/coverage-shard-7
coverage-shards/coverage-shard-12
coverage-shards/coverage-shard-3
coverage-shards/coverage-shard-2
coverage-shards/coverage-shard-4
coverage-shards/coverage-shard-8
Using LCOV files for merging...
Found coverage files:
coverage-shards/coverage-shard-11/lcov.info
coverage-shards/coverage-shard-10/lcov.info
coverage-shards/coverage-shard-1/lcov.info
coverage-shards/coverage-shard-9/lcov.info
coverage-shards/coverage-shard-5/lcov.info
coverage-shards/coverage-shard-6/lcov.info
coverage-shards/coverage-shard-7/lcov.info
coverage-shards/coverage-shard-12/lcov.info
coverage-shards/coverage-shard-3/lcov.info
coverage-shards/coverage-shard-2/lcov.info
coverage-shards/coverage-shard-4/lcov.info
coverage-shards/coverage-shard-8/lcov.info
Merging coverage files: coverage-shards/coverage-shard-11/lcov.info coverage-shards/coverage-shard-10/lcov.info coverage-shards/coverage-shard-1/lcov.info coverage-shards/coverage-shard-9/lcov.info coverage-shards/coverage-shard-5/lcov.info coverage-shards/coverage-shard-6/lcov.info coverage-shards/coverage-shard-7/lcov.info coverage-shards/coverage-shard-12/lcov.info coverage-shards/coverage-shard-3/lcov.info coverage-shards/coverage-shard-2/lcov.info coverage-shards/coverage-shard-4/lcov.info coverage-shards/coverage-shard-8/lcov.info 
ERROR: Merged coverage file is empty or missing!
Error: Process completed with exit code 1.