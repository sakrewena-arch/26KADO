import os, base64
def w(p,c):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p,"w",encoding="utf-8").write(c)
    print("Created:", p)
print("helper ready")


LEVELS = 'test123'
w("src/app/admin/levels/page.tsx", LEVELS)
print("done")