#!/bin/bash
# Branch Cleanup Script
# Keeps: main, testing1, testing2, claude/fix-3d-display-je5VW
# Deletes everything else
#
# Run this with your own git credentials:
#   chmod +x cleanup-branches.sh && ./cleanup-branches.sh

set -e

echo "=== Remote Branch Cleanup ==="
echo ""
echo "Branches to DELETE:"

BRANCHES_TO_DELETE=(
  "master"
  "testing3"
  "claude/merge-tariffs-heatmap-8uDqB"
  "claude/tariffs-heatmap-popup-8glMi"
  "claude/earth-rotation-ui-styling-iwKI7"
  "claude/migrate-maplibre-F3Nos"
  "claude/add-3d-space-background-He6iH"
  "claude/add-frontline-indicator-aTI7v"
  "claude/cleanup-unused-branches-vQsfS"
)

for branch in "${BRANCHES_TO_DELETE[@]}"; do
  echo "  - origin/$branch"
done

echo ""
echo "Branches to KEEP:"
echo "  - origin/main"
echo "  - origin/testing1"
echo "  - origin/testing2"
echo "  - origin/claude/fix-3d-display-je5VW"
echo ""

read -p "Proceed with deletion? (y/N) " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

for branch in "${BRANCHES_TO_DELETE[@]}"; do
  echo "Deleting origin/$branch..."
  git push origin --delete "$branch" 2>&1 && echo "  ✓ Deleted" || echo "  ✗ Failed (may already be deleted)"
done

echo ""
echo "=== Cleanup complete ==="
echo "Remaining remote branches:"
git branch -r
