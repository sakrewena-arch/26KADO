import base64, json
m = json.load(open("__manifest.json"))
m["logs"] = base64.b64encode(open("__logs_content.txt","rb").read()).decode()
json.dump(m, open("__manifest.json","w"))
print("logs added")
