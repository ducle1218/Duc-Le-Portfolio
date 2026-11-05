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

Filters persist in this browser only. Resume text, screenshots and generated PDFs
are not uploaded to the collector or reader. Link import uses the index first,
then public Greenhouse/Lever APIs, then Jina Reader for supported public job
boards. The public URL is sent to Jina; applicant data is not. Jina has a free
unauthenticated allowance, throttled here to at most one read every 3.1 seconds.
Its availability and limits may change. Login-only, blocked, missing, or
ambiguous pages require pasted text or screenshots. Imported postings remain
in this browser session and have their own list, independent of search filters. Import limits are 20 links; export limits are
15 jobs per batch. A cancelled batch saves completed PDFs. Partial failures are
listed in `job-report.json` alongside the original URLs and wording changes.

Hidden means unlisted and `noindex`, not authenticated. The generator only uses
the already-public resume and portfolio facts. Do not add credentials/private
profile data here. The Word template remains outside this public repository.

## Validation

```
python scripts/check-job-collector.py
node scripts/check-job-reader.mjs
node scripts/check-job-insights.mjs
node scripts/check-resume-generator.mjs
```

The reader check generates a ZIP from two actual feed postings and verifies the
one-page PDFs and four hyperlinks. Browser QA covers filters, multi-job export,
manual preview, direct imports, and the dark/light responsive layouts.

## Reading, ranking, and evidence

`job-reader.mjs` parses a single JobPosting JSON-LD object or a known job-only
description element. It never scores entire-page text, related jobs, or search
results. LinkedIn metadata is scoped to the actual top card; relative posting
dates are marked approximate. Structured salaries retain currency and period.
Description pay excerpts never infer a missing pay period or eligibility tier.

The free reader is documented at https://jina.ai/reader/ and
https://docs.jina.ai/. A real public LinkedIn HVAC internship was verified during
implementation. Other supported hosts depend on their public HTML/JobPosting
data; support is best-effort, not a promise to bypass sign-in or access controls.

`data/resume-match-profile.json` contains reviewed quotes from the canonical
resume and its SHA-256. A changed resume pauses scoring until this evidence is
reviewed; stale skills must never be presented as current. `job-insights.mjs`
counts a finite dictionary of skills once each, weighting explicit required
mentions twice. The percentage is skill overlap only, not hiring probability.
Unknown or fewer than three recognizable skills produce no percentage. Missing
skills and academic/work-authorization requirements remain visible.

`data/company-rankings.json` is a selected, sourced subset of 2026 Fortune 500
US revenue rankings. It is not the complete list or an objective prestige score.
Exact company names/explicit aliases match; subsidiaries do not inherit a rank
without verified mapping. Unlisted companies display ranking unavailable.
Company ordering uses freshness first, personal priorities (SpaceX by default),
verified rank, then match score. Users can choose match or posting-date sorting.
Old does not mean closed: 60-day-old listings are flagged; a source not checked
within 36 hours is stale; only explicit closure or passed deadlines mark closed.

Reader tests use synthetic job-page fixtures to verify related-job exclusion,
JSON-LD selection, salary units and access-failure handling. Ranking tests cover
unknown evidence, repeated keywords, stale/closed order and rank provenance.
