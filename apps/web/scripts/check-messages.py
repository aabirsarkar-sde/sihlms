"""Lists translation keys used in src/ that are missing from messages/<locale>.json. Usage: python3 scripts/check-messages.py [locale]"""
import json, re, sys, pathlib
loc = sys.argv[1] if len(sys.argv) > 1 else "en"
msgs = json.load(open(f"messages/{loc}.json"))
def has(path):
    cur = msgs
    for p in path.split("."):
        if not isinstance(cur, dict) or p not in cur: return False
        cur = cur[p]
    return True
decl = re.compile(r'const (\w+) = (?:await )?(?:useTranslations|getTranslations)\((?:\{[^}]*namespace: )?"([\w.]+)"')
missing = {}
for f in pathlib.Path("src").rglob("*.tsx"):
    src = f.read_text()
    for var, ns in decl.findall(src):
        for m in re.finditer(r'(?<![\w.])' + var + r'\(\s*"([^"]+)"', src):
            key = f"{ns}.{m.group(1)}"
            if not has(key): missing.setdefault(key, str(f))
        for m in re.finditer(r'(?<![\w.])' + var + r'\(\s*`([^`$]+)\$\{', src):
            prefix = f"{ns}.{m.group(1).rstrip('.')}"
            if not has(prefix): missing.setdefault(prefix + ".*", str(f))
for k in sorted(missing): print(k)
print(f"-- {len(missing)} missing", file=sys.stderr)
