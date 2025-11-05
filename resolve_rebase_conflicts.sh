#!/bin/bash

cd /Users/kiwoon/Desktop/works/mysked-teamwork/mysked-frontend

iteration=0
while git status 2>/dev/null | grep -q "rebase in progress"; do
  iteration=$((iteration + 1))
  echo "=== Iteration $iteration ==="
  
  # Get conflicted files
  conflicted_files=()
  while IFS= read -r line; do
    [ -n "$line" ] && conflicted_files+=("$line")
  done < <(git status --short 2>/dev/null | grep "^UU\|^AA" | awk '{print $2}')
  
  if [ ${#conflicted_files[@]} -eq 0 ]; then
    echo "No conflicts found, continuing rebase..."
    GIT_EDITOR=true git rebase --continue 2>&1 | head -10
    continue
  fi
  
  echo "Resolving ${#conflicted_files[@]} conflicted files..."
  for file in "${conflicted_files[@]}"; do
    echo "  - Resolving: $file"
    git checkout --ours "$file" 2>/dev/null
  done
  
  git add -A 2>/dev/null
  echo "Continuing rebase..."
  GIT_EDITOR=true git rebase --continue 2>&1 | head -10
  
  # Small delay to avoid too rapid iterations
  sleep 0.1
done

if git status 2>/dev/null | grep -q "rebase in progress"; then
  echo "Rebase still in progress. Please check manually."
else
  echo "Rebase completed successfully!"
  git status
fi
