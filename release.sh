#!/bin/bash

# Release script for stripe-view
# Usage: ./release.sh 0.0.4

set -e

if [ -z "$1" ]; then
    echo "Error: Version number required"
    echo "Usage: ./release.sh <version>"
    echo "Example: ./release.sh 0.0.4"
    exit 1
fi

VERSION=$1

# Validate version format (basic check)
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: Version must be in format X.Y.Z (e.g., 0.0.4)"
    exit 1
fi

echo "🚀 Starting release process for v$VERSION..."
echo ""

# Check for uncommitted changes (both staged and unstaged)
git update-index --refresh > /dev/null 2>&1 || true
if ! git diff-index --quiet HEAD -- || [ -n "$(git status --porcelain)" ]; then
    echo "❌ Error: You have uncommitted changes. Please commit or stash them first."
    git status --short
    exit 1
fi

# Ensure we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Error: Must be on main branch (currently on $CURRENT_BRANCH)"
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull

# Update version in package.json
echo "📝 Updating version in package.json..."
sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" package.json

# Show the change
echo "✓ Version updated to $VERSION"
echo ""

# Commit the version change (only if there are changes)
if ! git diff-index --quiet HEAD -- package.json; then
    echo "💾 Committing version change..."
    git add package.json
    git commit -m "v$VERSION release"
else
    echo "ℹ️  Version already set to $VERSION, skipping commit"
fi

# Create tag (force overwrite if it exists)
echo "🏷️  Creating tag v$VERSION..."
git tag -f "v$VERSION"

# Push commit and tag together atomically (avoids double build)
echo "⬆️  Pushing to GitHub..."
git push origin main
git push -f origin "v$VERSION"

echo ""
echo "✅ Release v$VERSION complete!"
echo ""
echo "📦 GitHub Actions will now build the Windows executable."
echo "🔗 Check the release at: https://github.com/JonathanGiles/stripe-view/releases/tag/v$VERSION"
echo ""
