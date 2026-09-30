"""Deep-merge a JSON fragment into messages/<locale>.json: python3 scripts/merge-messages.py en fragment.json"""
import json, sys
loc, frag = sys.argv[1], sys.argv[2]
path = f"messages/{loc}.json"
try:
    base = json.load(open(path))
except FileNotFoundError:
    base = {}
def merge(a, b):
    for k, v in b.items():
        if isinstance(v, dict) and isinstance(a.get(k), dict):
            merge(a[k], v)
        else:
            a[k] = v
merge(base, json.load(open(frag)))
json.dump(base, open(path, "w"), ensure_ascii=False, indent=2)
open(path, "a").write("\n")
