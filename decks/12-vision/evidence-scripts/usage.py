# Second pass: reads the Java source of each 2026 robot project found by trees.py + analyze.py and
# counts what the code constructs or calls, so template files that are present but unused count less.
# Usage: python3 -I usage.py trees.json analysis.json out.json workdir
import json, os, re, shutil, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor
T = json.load(open(sys.argv[1])); A = json.load(open(sys.argv[2])); outp, work = sys.argv[3], sys.argv[4]
roots = {}
for r in T["records"]:
    if r["repo"] in A["per_repo"]:
        roots[r["repo"]] = [p["root"] for p in r["projects"] if p["java_files"] > 0 and str(p["gradlerio"] or "").startswith("2026")
                            and any((d.get("name") or "") == "WPILib-New-Commands" for d in p["deps"])]
PAT = {
    "pv_camera": re.compile(r"new\s+PhotonCamera\s*\("),
    "pv_sim": re.compile(r"new\s+VisionSystemSim\s*\("),
    "pv_camera_own": re.compile(r"new\s+PhotonCamera\s*\("),
    "akit_io_pv_real": re.compile(r"new\s+VisionIOPhotonVision\s*\("),
    "akit_io_pv_sim": re.compile(r"new\s+VisionIOPhotonVisionSim\s*\("),
    "ll_helpers_call": re.compile(r"LimelightHelpers\s*\.\s*\w+\s*\("),
    "ll_megatag2": re.compile(r"MegaTag2\s*\("),
    "akit_io_ll": re.compile(r"new\s+VisionIOLimelight\s*\("),
    "akit_io_pv": re.compile(r"new\s+VisionIOPhotonVision(Sim)?\s*\("),
    "ll_nt_table": re.compile(r"getTable\s*\(\s*\"limelight"),
    "quest": re.compile(r"new\s+QuestNav\s*\("),
    "rio_apriltag": re.compile(r"new\s+AprilTagDetector\s*\("),
    "add_vision_measurement": re.compile(r"addVisionMeasurement\s*\("),
    "pv_object_detection": re.compile(r"getDetectedObjectClassID\s*\("),
    "ll_object_detection": re.compile(r"LimelightHelpers\s*\.\s*(getRawDetections|getDetectorClass\w*|getNeuralClassID|getClassifierClass\w*)\s*\("),
}
def strip_comments(text):
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    return "\n".join(l.split("//", 1)[0] for l in text.splitlines())
def scan(repo):
    d = os.path.join(work, repo.replace("/", "__")); shutil.rmtree(d, ignore_errors=True)
    rec = {"repo": repo, "ok": False}
    try:
        env = {**os.environ, "GIT_TERMINAL_PROMPT": "0"}
        r = subprocess.run(["git", "clone", "-q", "--depth", "1", "--filter=blob:none", "--no-checkout", f"https://github.com/{repo}", d], capture_output=True, text=True, timeout=180, env=env)
        if r.returncode: rec["error"] = r.stderr[-200:]; return rec
        subprocess.run(["git", "sparse-checkout", "set", "--no-cone"] + [f"/{root}src/main/java/" for root in roots[repo]], cwd=d, capture_output=True, env=env, timeout=60)
        subprocess.run(["git", "checkout", "-q", "HEAD"], cwd=d, capture_output=True, env=env, timeout=300)
        hits = {k: False for k in PAT}
        nfiles = 0
        for root, _, files in os.walk(d):
            if "/.git" in root: continue
            for f in files:
                if not f.endswith(".java"): continue
                nfiles += 1
                try: txt = strip_comments(open(os.path.join(root, f), encoding="utf-8", errors="replace").read())
                except OSError: continue
                for k, p in PAT.items():
                    if k == "ll_helpers_call" and f.lower() == "limelighthelpers.java": continue
                    if k == "ll_megatag2" and f.lower() == "limelighthelpers.java": continue
                    if k == "pv_camera_own" and f.lower().startswith("visioniophotonvision"): continue
                    if not hits[k] and p.search(txt): hits[k] = True
        rec.update(ok=True, java_files_read=nfiles, hits=hits)
    except subprocess.TimeoutExpired:
        rec["error"] = "timeout"
    finally:
        shutil.rmtree(d, ignore_errors=True)
    return rec
t0 = time.time()
with ThreadPoolExecutor(6) as ex: recs = list(ex.map(scan, sorted(roots)))
json.dump({"seconds": round(time.time() - t0), "records": recs}, open(outp, "w"), indent=1)
print(len(recs), "ok", sum(r["ok"] for r in recs), "in", round(time.time() - t0), "s")
