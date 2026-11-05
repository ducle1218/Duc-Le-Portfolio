# Website job finder

The unlisted `/generator/` page searches a public index of employer internships.
It shares the existing resume template, claim checks, and reviewed wording variants.
It does not submit applications or invent qualifications.

## Free hosted collection

`.github/workflows/deploy.yml` runs the collector on pushes, manual dispatch, and
at 07:17 / 19:17 UTC daily. GitHub schedules can be delayed; the UI shows the
actual check time and flags an index older than 36 hours. GitHub may disable
scheduled workflows after 60 days without repository activity; re-enable the
workflow in Actions if that occurs. Standard hosted runners are free for this
public repository. Greenhouse and Lever public GET APIs need no key.

`job-sources.json` is the explicit employer coverage list. To add an employer,
verify its official board, add its provider (`greenhouse` or `lever`), board slug,
and company display name. Run `python scripts/collect-jobs.py` and inspect the
reported health. This does not search all employers, LinkedIn, or Indeed.

The collector indexes internship/co-op titles, preserving full descriptions,
locations, source links, original publication dates when provided, and check
times. Greenhouse `updated_at` and Lever `createdAt` are not publication dates.
Unreachable boards and unreadable postings are counted explicitly. If all boards
fail, deployment fails and the last published site remains available. Results
from failed feeds are omitted rather than silently reusing closed postings.

The tracked `data/jobs.json` is a seed snapshot for local use. Each deployment
replaces it in the published artifact with a fresh collection; no scheduled bot
commits or private applicant data are needed.

## Browser behavior

Default filters: engineering internships in NJ, NY, PA plus US remote. Comma
separated role keywords match titles. Other filters exclude companies, title
keywords, or description keywords. Unknown location/date results require review
and are never selected by the "Select up to 15 matches" shortcut.

Filters persist in this browser only. Searches, imported postings, resume text,
screenshots, and generated PDFs are not uploaded to the collector. Link import
uses the index first, then public Greenhouse/Lever APIs. Unsupported links explain
how to paste text or screenshots. Import limits are 20 links; export limits are
15 jobs per batch. A cancelled batch saves completed PDFs. Partial failures are
listed in `job-report.json` alongside the original URLs and wording changes.

Hidden means unlisted and `noindex`, not authenticated. The generator only uses
the already-public resume and portfolio facts. Do not add credentials/private
profile data here. The Word template remains outside this public repository.

## Validation

```
python scripts/check-job-collector.py
node scripts/check-job-reader.mjs
node scripts/check-resume-generator.mjs
```

The reader check generates a ZIP from two actual feed postings and verifies the
one-page PDFs and four hyperlinks. Browser QA covers filters, multi-job export,
manual preview, direct imports, and the dark/light responsive layouts.
