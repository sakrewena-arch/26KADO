import base64, json
m = json.load(open("__manifest.json"))
print("current keys:", list(m.keys()))
