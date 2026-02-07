#!/bin/bash
# I just catgpt'd this because yes

# Script to clean up duplicate tags from the bug

echo "Finding duplicate tags (multiple tags pointing to same commit)..."
echo ""

# Get all tags with their commit SHA
declare -A commits
declare -a dupes

while read -r tag; do
    sha=$(git rev-list -n 1 "$tag" 2>/dev/null)
    
    if [[ -z "$sha" ]]; then
        continue
    fi
    
    if [[ -z "${commits[$sha]}" ]]; then
        # First tag for this commit
        commits[$sha]="$tag"
    else
        # Duplicate found
        dupes+=("$tag")
        echo "Duplicate: $tag (same commit as ${commits[$sha]})"
    fi
done < <(git tag -l)

echo ""
echo "Found ${#dupes[@]} duplicate tags to delete"
echo ""

if [[ ${#dupes[@]} -eq 0 ]]; then
    echo "No duplicates found!"
    exit 0
fi

echo "Duplicates to delete:"
for tag in "${dupes[@]}"; do
    echo "  - $tag"
done

echo ""
read -p "Delete these ${#dupes[@]} tags? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Deleting local tags..."
    for tag in "${dupes[@]}"; do
        git tag -d "$tag"
        echo "  Deleted local: $tag"
    done
    
    echo ""
    echo "Deleting remote tags..."
    git push origin --delete "${dupes[@]}"
    echo "Done!"
else
    echo "Cancelled."
    exit 1
fi
