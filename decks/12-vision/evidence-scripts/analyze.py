# Counts vision libraries in the 2026 Java robot projects read by trees.py. Usage: python3 -I analyze.py trees.json frame.json
import json, sys, collections
T = json.load(open(sys.argv[1])); F = json.load(open(sys.argv[2]))
PHOTON = "515fe07e-bfc6-11fa-b3de-0242ac130004"
def is_cmd(d): return (d.get("name") or "") == "WPILib-New-Commands"
def flags(p):
    names = [(d.get("name") or "").lower() for d in p["deps"]]
    files = [f.lower() for f in p["vision_files"]]
    return {
        "photon": any(d.get("uuid") == PHOTON or (d.get("name") or "").lower() == "photonlib" for d in p["deps"]),
        "photon_2026": any((d.get("uuid") == PHOTON or (d.get("name") or "").lower() == "photonlib") and str(d.get("version","")).startswith("v2026") for d in p["deps"]),
        "llhelpers": "limelighthelpers.java" in files,
        "ll_dep": any("limelight" in n for n in names),
        "quest": any("questnav" in n or any("questnav" in str(u).lower() for u in d.get("maven", [])) for n, d in zip(names, p["deps"])),
        "akit_vision_ll": "visioniolimelight.java" in files,
        "akit_vision_pv": "visioniophotonvision.java" in files,
        "ll_named_file": any("limelight" in f and f != "limelighthelpers.java" for f in files),
        "akit": any("advantagekit" in n for n in names),
    }
repos, owners = {}, collections.defaultdict(lambda: collections.defaultdict(bool))
depnames = collections.Counter(); other_vision = collections.Counter(); versions = collections.Counter()
nonjava = 0; not2026 = 0
for r in T["records"]:
    if not r["ok"]: continue
    projs = [p for p in r.get("projects", []) if any(is_cmd(d) for d in p["deps"])]
    if projs and not any(p["java_files"] > 0 for p in projs): nonjava += 1
    projs = [p for p in projs if p["java_files"] > 0 and str(p["gradlerio"] or "").startswith("2026")]
    if not projs: continue
    f = collections.defaultdict(bool)
    seen = set()
    for p in projs:
        for k, v in flags(p).items(): f[k] |= v
        for d in p["deps"]:
            n = d.get("name") or d["file"]
            if n not in seen: depnames[n] += 1; seen.add(n)
            if d.get("uuid") == PHOTON: versions[d.get("version")] += 1
            low = (n or "").lower()
            if any(k in low for k in ["vision", "camera", "lime", "quest", "apriltag", "photon"]) and low != "photonlib": other_vision[n] += 1
    f["any"] = f["photon"] or f["llhelpers"] or f["quest"]
    f["none"] = not f["any"]
    f["both_pv_ll"] = f["photon"] and f["llhelpers"]
    f["photon_only"] = f["photon"] and not f["llhelpers"]
    f["ll_only"] = f["llhelpers"] and not f["photon"]
    repos[r["repo"]] = dict(f)
    o = r["repo"].split("/")[0].lower()
    for k, v in f.items(): owners[o][k] |= v
N, O = len(repos), len(owners)
keys = ["photon", "photon_2026", "llhelpers", "ll_dep", "quest", "photon_only", "ll_only", "both_pv_ll", "none", "akit", "akit_vision_ll", "akit_vision_pv", "ll_named_file"]
counts = {k: {"repos": sum(v[k] for v in repos.values()), "owners": sum(v[k] for v in owners.values())} for k in keys}
for k in keys: counts[k]["repos_pct"] = round(100 * counts[k]["repos"] / N, 1); counts[k]["owners_pct"] = round(100 * counts[k]["owners"] / O, 1)
out = {"robot_projects": N, "owners": O, "repos_read": len(T["records"]), "frame_repos": len(F["repos"]),
       "c_plus_plus_or_no_java_skipped": nonjava, "counts": counts,
       "photonlib_versions": versions.most_common(), "other_vision_vendordeps": other_vision.most_common(),
       "top_vendordeps": depnames.most_common(25), "per_repo": repos}
json.dump(out, open("analysis.json", "w"), indent=1)
print("robot projects", N, "owners", O)
for k in keys: print(f"{k:16s} {counts[k]['repos']:4d} ({counts[k]['repos_pct']}%)  owners {counts[k]['owners']} ({counts[k]['owners_pct']}%)")
print("photon versions", versions.most_common(8)); print("other vision deps", other_vision.most_common(15)); print("top deps", depnames.most_common(20))
