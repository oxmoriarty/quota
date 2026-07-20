import sys
import re

def search_file(filepath, pattern, output_filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            with open(output_filepath, 'w', encoding='utf-8') as out:
                for i, line in enumerate(f, 1):
                    if re.search(pattern, line, re.IGNORECASE):
                        out.write(f"Line {i}: {line.strip()}\n")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    search_file("Genlayer builder full documentation.txt", r"(fetch|request|http|url|external|web|internet)", "scratch/search_results_utf8.txt")
