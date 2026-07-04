import os, base64

def w(p,c):
    os.makedirs(os.path.dirname(p),exist_ok=True)
    with open(p,"w",encoding="utf-8") as f:
        f.write(c)
    print("Created:",p)

# Read base64-encoded contents from manifest
import json
m = json.load(open("__manifest.json"))
for k,v in m.items():
    d = base64.b64decode(v).decode("utf-8")
    w(f"src/app/admin/{k}/page.tsx", d)
print("All done!")
