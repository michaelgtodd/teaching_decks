# Joins frame.json, trees.json, analysis.json and usage.json into the deck's evidence.json.
import json, sys
F = json.load(open('frame.json')); T = json.load(open('trees.json')); A = json.load(open('analysis.json')); U = json.load(open('usage.json'))
hits = {r['repo']: r['hits'] for r in U['records'] if r['ok']}
repos = sorted(hits)
N = len(repos)
owner = lambda r: r.split('/')[0].lower()
O = len({owner(r) for r in repos})
code = {
  'pv_real': lambda H: H['pv_camera_own'] or H['akit_io_pv_real'],
  'pv_any': lambda H: H['pv_camera'] or H['akit_io_pv'],
  'pv_sim_only': lambda H: (H['pv_camera'] or H['akit_io_pv']) and not (H['pv_camera_own'] or H['akit_io_pv_real']),
  'll': lambda H: H['ll_helpers_call'] or H['akit_io_ll'] or H['ll_nt_table'],
  'quest': lambda H: H['quest'],
  'rio_apriltag': lambda H: H['rio_apriltag'],
  'add_vision_measurement': lambda H: H['add_vision_measurement'],
  'pv_vision_system_sim': lambda H: H['pv_sim'],
  'll_megatag2': lambda H: H['ll_megatag2'],
  'object_detection_pv_or_ll': lambda H: H['pv_object_detection'] or H['ll_object_detection'],
  'akit_template_ll_io': lambda H: H['akit_io_ll'],
  'akit_template_pv_sim_io': lambda H: H['akit_io_pv_sim'],
}
code['pv_real_and_ll'] = lambda H: code['pv_real'](H) and code['ll'](H)
code['pv_real_only'] = lambda H: code['pv_real'](H) and not code['ll'](H)
code['ll_only'] = lambda H: code['ll'](H) and not code['pv_real'](H)
code['none'] = lambda H: not (code['pv_real'](H) or code['ll'](H) or H['quest'] or H['rio_apriltag'])
def tally(pred):
    rs = [r for r in repos if pred(r)]
    return {'repos': len(rs), 'repos_pct': round(100 * len(rs) / N, 1), 'owners': len({owner(r) for r in rs}), 'owners_pct': round(100 * len({owner(r) for r in rs}) / O, 1)}
files = {k: tally(lambda r, k=k: A['per_repo'][r][k]) for k in ['photon', 'llhelpers', 'quest', 'none', 'both_pv_ll', 'akit', 'akit_vision_ll', 'akit_vision_pv']}
codec = {k: tally(lambda r, f=f: f(hits[r])) for k, f in code.items()}
out = {
  'checked_on': '2026-11-06',
  'method': [
    'Frame: GitHub code search (REST search/code) for files every 2026 WPILib project has, with no vision term: build.gradle with GradleRIO 2026.2.1 (split by includeDesktopSupport true/false to stay under the 1,000-result cap), 2026.1.1, 2026.1.1-beta-1, and vendordeps/WPILibNewCommands.json with frcYear 2026. Repository search returned HTTP 502 in this session, so it could not be used as Deck 10 did.',
    'Sample: a seeded random 1,000 (Python random.Random(2026).shuffle of the sorted non-fork frame).',
    'Trees: each repo read with git clone --depth 1 --filter=blob:none and git ls-tree (the Git Trees API was not open to this session). Only vendordeps/*.json and build.gradle were fetched as files.',
    'Robot project: a build.gradle with GradleRIO 2026.x, a sibling vendordeps/ with WPILib-New-Commands, and Java files under src/main/java. A repo counts once if any of its projects qualifies.',
    'Files: PhotonLib vendordep by uuid 515fe07e-bfc6-11fa-b3de-0242ac130004; LimelightHelpers.java by file name; QuestNav by a vendordep whose name or maven URL contains questnav.',
    'Code: every .java file under src/main/java of those projects, comments stripped. PhotonVision on the robot = new PhotonCamera( outside AdvantageKit template files named VisionIOPhotonVision*.java, or new VisionIOPhotonVision( (not ...Sim). Limelight = a LimelightHelpers.x( call outside LimelightHelpers.java, new VisionIOLimelight(, or getTable("limelight. QuestNav = new QuestNav(. WPILib on the roboRIO = new AprilTagDetector(.',
  ],
  'limits': [
    'Counts what is in a repo at its default branch on 2026-11-06, not what ran at events.',
    'Code search indexes only some repos, so the frame is not every 2026 project. Selection uses no vision term.',
    'Private repos are missing. Practice and prototype repos are included, and one owner can have several repos.',
    'Template code that is present but never run still counts, for example YAGSL or other swerve templates that create a PhotonCamera.',
    'Java only.',
  ],
  'frame': {'queries': F['queries'], 'unique_repos': len(F['repos']), 'forks': sum(e['fork'] for e in F['repos'].values()), 'run_at': F['run_at']},
  'sample': {'seed': T['seed'], 'size': T['sample_size'], 'read_ok': sum(r['ok'] for r in T['records'])},
  'robot_projects': N, 'owners': O,
  'files': files, 'code': codec,
  'photonlib_versions': A['photonlib_versions'], 'other_vision_vendordeps': A['other_vision_vendordeps'], 'top_vendordeps': A['top_vendordeps'],
  'per_repo': {r: {'files': {k: A['per_repo'][r][k] for k in ['photon', 'llhelpers', 'quest']}, 'code': {k: bool(v) for k, v in hits[r].items()}} for r in repos},
}
json.dump(out, open(sys.argv[1], 'w'), indent=1)
for k, v in files.items(): print('file', k, v)
for k, v in codec.items(): print('code', k, v)
