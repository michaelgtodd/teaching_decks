# Builds the sampling frame: repos found by GitHub code search for files every 2026 WPILib project has.
# Selection never mentions a vision library. Output: frame.json {queries:[{q,total,got}], repos:{full_name:[query idx]}}
import json, subprocess, sys, time
Q = [
  '"edu.wpi.first.GradleRIO" "2026.2.1" "includeDesktopSupport = true" filename:build.gradle',
  '"edu.wpi.first.GradleRIO" "2026.2.1" "includeDesktopSupport = false" filename:build.gradle',
  '"edu.wpi.first.GradleRIO" "2026.1.1" filename:build.gradle',
  '"edu.wpi.first.GradleRIO" "2026.1.1-beta-1" filename:build.gradle',
  '"frcYear": "2026" filename:WPILibNewCommands.json',
  '"WPILib-New-Commands" "2026" path:vendordeps',
]
out = {"queries": [], "repos": {}, "run_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
def call(q, page):
    for attempt in range(6):
        r = subprocess.run(["gh", "api", "-X", "GET", "search/code", "-f", f"q={q}", "-f", "per_page=100", "-f", f"page={page}"], capture_output=True, text=True)
        if r.returncode == 0:
            return json.loads(r.stdout)
        sys.stderr.write(f"retry {q[:40]} p{page}: {r.stdout[:120]} {r.stderr[:120]}\n")
        time.sleep(30)
    return None
for i, q in enumerate(Q):
    got, total = 0, None
    for page in range(1, 11):
        d = call(q, page); time.sleep(7)
        if not d: break
        total = d["total_count"]
        items = d.get("items", [])
        for it in items:
            out["repos"].setdefault(it["repository"]["full_name"], {"q": [], "fork": it["repository"]["fork"], "paths": []})
            e = out["repos"][it["repository"]["full_name"]]
            if i not in e["q"]: e["q"].append(i)
            e["paths"].append(it["path"])
        got += len(items)
        if len(items) < 100 or got >= total: break
    out["queries"].append({"q": q, "total_count": total, "items_read": got})
    sys.stderr.write(f"{i} total={total} read={got} unique_repos={len(out['repos'])}\n")
json.dump(out, open(sys.argv[1], "w"), indent=1)
