import os
base = r"c:\Users\DG\Desktop\26kdo\src\app\admin"
def w(rel, content):
    p = os.path.join(base, rel)
    d = os.path.dirname(p)
    if not os.path.exists(d): os.makedirs(d, exist_ok=True)
    with open(p, "w", encoding="utf-8") as f: f.write(content)
    print(f"OK: {rel}")
