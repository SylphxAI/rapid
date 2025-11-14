#!/bin/bash
set -e

# Get version
VERSION=$(node -p "require('./packages/zen/package.json').version")
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📊 Benchmarking Zen v${VERSION}"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Build
echo "🔨 Building Zen..."
cd packages/zen
bun run build
cd ../..
echo "✅ Build complete"
echo ""

# Link to external benchmark
echo "🔗 Linking to external benchmark..."
cd /tmp/benchmark/benchmarks/state-management

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing benchmark dependencies..."
  bun install
fi

# Link zen package
rm -rf node_modules/@sylphx/zen
ln -sf /Users/kyle/zen/packages/zen node_modules/@sylphx/zen

cd /Users/kyle/zen
echo "✅ Link complete"
echo ""

# Run benchmark
echo "🏃 Running external benchmark..."
echo ""
cd /tmp/benchmark/benchmarks/state-management
bun run index.ts --libraries=@sylphx/zen 2>&1 | tee /tmp/zen-benchmark-result.txt

# Save to history
mkdir -p /Users/kyle/zen/benchmark-history
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
cp /tmp/zen-benchmark-result.txt "/Users/kyle/zen/benchmark-history/zen-v${VERSION}-${TIMESTAMP}.txt"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ Benchmark complete!"
echo "📁 Results saved to: benchmark-history/zen-v${VERSION}-${TIMESTAMP}.txt"
echo "═══════════════════════════════════════════════════════════"

cd /Users/kyle/zen
