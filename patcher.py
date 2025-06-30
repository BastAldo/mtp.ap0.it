#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
patcher.py

Applies a structured patch from a YAML file. Can optionally stage and commit
the changes after receiving user confirmation.
"""

import argparse
import os
import sys
import subprocess
from pathlib import Path

# PyYAML is required. To install: pip install pyyaml
try:
    import yaml
except ImportError:
    print("Error: PyYAML library not found. Please install it using 'pip install pyyaml'", file=sys.stderr)
    sys.exit(1)

def apply_file_patches(patches: list[dict], base_dir: Path):
    """
    Iterates through patches and overwrites files with new content.
    """
    if not patches:
        print("No file patches found in the YAML. Skipping file operations.")
        return

    print("🚀 Applying file patches...")
    for patch in patches:
        try:
            file_path_str = patch.get('file')
            # Handle cases where content is explicitly null or empty (e.g., content: "")
            content = patch.get('content') if patch.get('content') is not None else ""

            if file_path_str is None:
                print(f"⚠️  Warning: Skipping invalid patch entry (missing 'file' key): {patch}", file=sys.stderr)
                continue

            target_file = base_dir / file_path_str
            print(f"  - Processing: {file_path_str}")

            target_file.parent.mkdir(parents=True, exist_ok=True)
            with open(target_file, 'w', encoding='utf-8') as f:
                f.write(content)

            print(f"✅ Successfully patched {file_path_str}")

        except Exception as e:
            print(f"❌ An unexpected error occurred while processing {patch.get('file')}: {e}", file=sys.stderr)

def run_git_commit(commit_message: str):
    """
    Stages all changes and commits them with the given message, after user confirmation.
    """
    print("\n" + "="*50)
    print("Git Commit Automation")
    print(f"Commit message: \"{commit_message}\"")
    
    try:
        # Check if we are in a git repository before proceeding
        subprocess.run(["git", "rev-parse", "--is-inside-work-tree"], check=True, capture_output=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Error: Not a git repository or 'git' command not found. Skipping commit.", file=sys.stderr)
        return

    # Ask for user confirmation
    choice = input("👉 Stage and commit all changes? (y/n): ").lower().strip()

    if choice != 'y':
        print("🚫 Commit skipped by user.")
        return

    try:
        print("  - Staging all changes ('git add .')...")
        subprocess.run(["git", "add", "."], check=True, capture_output=True)

        print(f"  - Committing...")
        # Use capture_output to hide git's success message for a cleaner output
        result = subprocess.run(
            ["git", "commit", "-m", commit_message], 
            check=True, 
            capture_output=True, 
            text=True
        )
        print("✅ Git commit successful.")
        # Print the concise output from the commit command
        print("\n" + result.stdout.strip())

    except subprocess.CalledProcessError as e:
        print(f"❌ An error occurred during git operation.", file=sys.stderr)
        # Print git's error message for clarity
        print(f"   Error details:\n{e.stderr.strip()}", file=sys.stderr)
    except FileNotFoundError:
        # This case is already handled above, but included for completeness
        print("❌ Error: 'git' command not found. Is Git installed and in your PATH?", file=sys.stderr)

# --- MODIFICA INIZIA QUI ---

def display_informational_messages(commands: list):
    """
    Displays post-patch informational messages from the YAML.
    Handles both simple strings and dictionaries in the commands list.
    """
    if not commands:
        return
        
    print("\n" + "="*50)
    print("Post-Patch Information")
    for item in commands:
        command_line = ""
        # Controlla se l'elemento è un dizionario o una stringa
        if isinstance(item, dict):
            # Se è un dizionario, cerca la chiave 'command' per la linea di comando
            command_line = item.get('command', '')
        elif isinstance(item, str):
            # Se è una stringa, usala direttamente
            command_line = item
        
        # Ora usa la variabile command_line che è sicuramente una stringa
        if command_line.strip().startswith("echo '") and command_line.strip().endswith("'"):
            message = command_line.strip()[6:-1]
            print(f"ℹ️  {message}")
        else:
            # Stampa comandi non-echo o stringhe vuote risultanti da dizionari malformati
            if command_line:
                print(f"   $ {command_line}")

# --- MODIFICA FINISCE QUI ---

def main():
    """Main function to parse arguments and orchestrate the patching process."""
    parser = argparse.ArgumentParser(
        description="Apply a structured YAML patch and optionally commit the changes.",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument(
        "patch_yaml",
        help="The path to the .yaml file containing the patch definition."
    )
    parser.add_argument(
        "--commit",
        action="store_true",
        help="Interactively prompt to stage and commit the changes after patching."
    )
    args = parser.parse_args()

    patch_file = Path(args.patch_yaml)

    try:
        print(f"📖 Reading patch file: {patch_file}")
        with open(patch_file, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
        if not isinstance(data, dict):
            raise TypeError("YAML content is not a valid dictionary.")
    except (FileNotFoundError, yaml.YAMLError, TypeError) as e:
        print(f"❌ Error processing YAML file: {e}", file=sys.stderr)
        sys.exit(1)

    commit_message = data.get('commit_message', "Automated commit by patcher.py")
    patches = data.get('patches', [])
    commands = data.get('commands', [])

    working_directory = Path.cwd()
    apply_file_patches(patches, working_directory)
    print("\n🎉 Patching phase complete!")

    # If the --commit flag is used, run the git commit process
    if args.commit:
        run_git_commit(commit_message)

    # Always display the informational commands at the end
    display_informational_messages(commands)

if __name__ == "__main__":
    main()