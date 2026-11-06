# Reads each sampled repo's file tree with a shallow blobless git clone (the Trees API is not open to this session),
# then fetches only vendordeps/*.json and build.gradle to confirm a 2026 Java robot project.
# Usage: python3 -I trees.py frame.json sample_size seed out.json workdir
import json, os, random, re, shutil, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor
frame, n, seed, outp, work = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4], sys.argv[5]
F = json.load(open(frame))
pool = sorted(r for r, e in F["repos"].items() if not e["fork"])
random.Random(seed).shuffle(pool)
sample = sorted(pool[:n])
PHOTON_UUID = "515fe07e-bfc6-11fa-b3de-0242ac130004"
def git(args, cwd=None, timeout=120):
    return subprocess.run(["git"] + args, cwd=cwd, capture_output=True, text=True, timeout=timeout,
                          env={**os.environ, "GIT_TERMINAL_PROMPT": "0"})
def read(repo):
    d = os.path.join(work, repo.replace("/", "__"))
    shutil.rmtree(d, ignore_errors=True)
    rec = {"repo": repo, "ok": False}
    try:
        r = git(["clone", "-q", "--depth", "1", "--filter=blob:none", "--no-checkout", f"https://github.com/{repo}", d])
        if r.returncode: rec["error"] = r.stderr.strip()[-200:]; return rec
        files = git(["ls-tree", "-r", "--name-only", "HEAD"], cwd=d).stdout.splitlines()
        rec["ok"] = True; rec["n_files"] = len(files)
        vd = [f for f in files if re.search(r"(^|/)vendordeps/[^/]+\.json$", f, re.I)]
        gradle = [f for f in files if re.search(r"(^|/)build\.gradle$", f)]
        want = vd + gradle
        if want:
            git(["sparse-checkout", "set", "--no-cone"] + ["/" + w for w in want], cwd=d)
            git(["checkout", "-q", "HEAD"], cwd=d, timeout=180)
        projects = []
        for g in gradle:
            root = g[: -len("build.gradle")]
            try: gtxt = open(os.path.join(d, g), encoding="utf-8", errors="replace").read()
            except OSError: continue
            m = re.search(r"edu\.wpi\.first\.GradleRIO\"?\s*\)?\s*version\s*[\"']([^\"']+)", gtxt)
            pvd = [v for v in vd if v.startswith(root + "vendordeps/") and v.count("/") == root.count("/") + 1]
            deps = []
            for v in pvd:
                try: j = json.load(open(os.path.join(d, v), encoding="utf-8-sig"))
                except Exception: deps.append({"file": v.split("/")[-1], "bad": True}); continue
                deps.append({"file": v.split("/")[-1], "name": j.get("name"), "uuid": j.get("uuid"), "version": j.get("version"),
                             "frcYear": j.get("frcYear"), "maven": j.get("mavenUrls", [])})
            src = [f for f in files if f.startswith(root + "src/main/java/") and f.endswith(".java")]
            projects.append({"root": root, "gradlerio": m.group(1) if m else None, "deps": deps,
                             "java_files": len(src),
                             "vision_files": sorted({f.split("/")[-1] for f in src if re.search(r"limelight|photon|questnav|quest|vision|apriltag", f.split("/")[-1], re.I)})})
        rec["projects"] = projects
    except subprocess.TimeoutExpired:
        rec["error"] = "timeout"
    finally:
        shutil.rmtree(d, ignore_errors=True)
    return rec
t0 = time.time()
with ThreadPoolExecutor(6) as ex:
    recs = list(ex.map(read, sample))
json.dump({"seed": seed, "frame_nonfork": len(pool), "sample_size": len(sample), "seconds": round(time.time() - t0),
           "records": recs}, open(outp, "w"), indent=1)
print(len(recs), "read in", round(time.time() - t0), "s; ok", sum(r["ok"] for r in recs))
