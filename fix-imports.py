#!/usr/bin/env python3
"""Fix import statements in migrated TUI files"""

import re
import os
from pathlib import Path

def fix_imports(content):
    """Fix missing commas and add FullscreenLayout where needed"""

    # Pattern to find import lines from @zen/tui
    import_pattern = r'(import\s+\{[^}]+\})\s+from\s+[\'"]@zen/tui[\'"];'

    def fix_import_line(match):
        import_stmt = match.group(1)

        # Check if FullscreenLayout is used but not imported
        has_fullscreen_usage = '<FullscreenLayout>' in content
        has_fullscreen_import = 'FullscreenLayout' in import_stmt

        # Fix missing commas before renderApp or FullscreenLayout
        import_stmt = re.sub(r'(\w+)\s+(renderApp|FullscreenLayout)', r'\1, \2', import_stmt)

        # Add FullscreenLayout if needed
        if has_fullscreen_usage and not has_fullscreen_import:
            # Add it before the closing }
            import_stmt = re.sub(r'(\w+)\s*}', r'\1, FullscreenLayout}', import_stmt)

        return import_stmt + ' from \'@zen/tui\';'

    content = re.sub(import_pattern, fix_import_line, content)

    return content

def process_file(filepath):
    """Process a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Skip if no renderApp
        if 'renderApp' not in content:
            return False

        new_content = fix_imports(content)

        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True

        return False
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    examples_dir = Path('/Users/kyle/zen/examples')

    fixed = 0
    for tsx_file in examples_dir.rglob('*.tsx'):
        if process_file(tsx_file):
            print(f"✓ Fixed: {tsx_file.relative_to(examples_dir)}")
            fixed += 1

    print(f"\nFixed {fixed} files")

if __name__ == '__main__':
    main()
