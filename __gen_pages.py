import base64, json, os

def w(p,c):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p,"w",encoding="utf-8") as f:
        f.write(c)
    print("Created:", p)

m = json.load(open("__manifest.json"))
for k, v in m.items():
    w(f"src/app/admin/{k}/page.tsx", base64.b64decode(v).decode("utf-8"))
print("All pages created!")
