#!/bin/bash

echo "Fixing Zod v4 breaking changes..."

# Fix 1: Replace required_error with message in z.enum()
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak \
  -e 's/z\.enum(\([^)]*\),\s*{\s*required_error:/z.enum(\1, { message:/g'

# Fix 2: Replace errorMap with message in z.enum()
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak \
  -e 's/z\.enum(\([^)]*\),\s*{\s*errorMap:/z.enum(\1, { message:/g'

# Fix 3: Replace required_error in other contexts
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak \
  -e 's/required_error:\s*"/message: "/g'

# Fix 4: Fix z.boolean() custom errors
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak \
  -e 's/z\.boolean()\.refine([^,]*, \([^)]*\))/z.boolean({ message: \1 })/g'

# Fix 5: Fix ZodError.errors -> ZodError.issues
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak \
  -e 's/\.errors\.map/\.issues.map/g' \
  -e 's/\.errors\.forEach/\.issues.forEach/g' \
  -e 's/\.errors\[/\.issues\[/g'

# Clean up backup files
find src -name "*.bak" -delete

echo "✅ Zod fixes applied!"
