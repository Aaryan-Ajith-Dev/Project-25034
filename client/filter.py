#!/usr/bin/env python3
# ndjson_to_json_array.py
# Usage: python ndjson_to_json_array.py input.ndjson output_first_1000.json [N]
import sys, json

def main():
    if len(sys.argv) < 3:
        print("Usage: python ndjson_to_json_array.py input.ndjson output.json [N]")
        sys.exit(1)

    src = sys.argv[1]
    dst = sys.argv[2]
    N = int(sys.argv[3]) if len(sys.argv) > 3 else 1000

    out = []
    with open(src, "r", encoding="utf-8") as fin:
        for line in fin:
            s = line.strip()
            if not s:
                continue
            out.append(json.loads(s))
            if len(out) >= N:
                break

    with open(dst, "w", encoding="utf-8") as fout:
        json.dump(out, fout, ensure_ascii=False, indent=2)

    print(f"Wrote {len(out)} objects to {dst}")

if __name__ == "__main__":
    main()
