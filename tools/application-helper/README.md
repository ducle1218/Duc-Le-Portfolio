# Application Helper 1.8.0 — Chrome and Edge

Version 1.8 removes the fixed answer-count caps. Website profile and imported-answer cards appear ten per page; saving and exporting includes every page. A 1 MB document-size guard remains. **Remember my answers** shows only new or changed detected answers by default; **Show all detected answers** also reveals existing matches. Saved profile answers and employer-specific memory are included in the comparison.

1. Download the ZIP from Application Studio and extract it.
2. Open `chrome://extensions` or `edge://extensions`, turn on Developer mode, choose **Load unpacked**, and select the extracted folder containing `manifest.json`.
3. Refresh Application Studio, unlock owner access, review and save your profile. No export is needed for the connected workflow.
4. Choose a job’s **Prepare application**, then **Start application with helper**. On first use, allow access to that employer’s site in the extension’s launch screen.
5. Open the employer's actual application form or sign in. The helper panel recognizes supported fields. Review the suggestions and the job-specific PDF filename, then choose **Fill selected**. The helper attaches the PDF to one supported resume/CV input. Check the employer’s upload status and submit yourself.

To update from 1.0, replace the old extracted files, click **Reload** on its extension card, and refresh Application Studio. If an employer redirects to a different domain, click the extension icon and **Scan current form** there. No profile is automatically injected into a different origin. New tabs opened by an employer are not automatically linked: start that application URL from Studio, or use manual import.

Your latest confirmed Studio profile is also saved in extension local storage, so it remains available after closing the browser or restarting the computer. The job-specific handoff stays in session storage for 30 minutes, scoped to its launched tab. Closing that tab or ending the helper removes the handoff; browser restart or extension reload clears session storage. No library key is included. Suggestions are matched locally, not sent to an AI service. Filling writes only selected answers into the employer’s form. Employers may save entered fields before final submission.

Manual fallback: export your profile JSON from Studio and import it through the extension popup. Imported profiles remain in local extension storage until **Forget profile**. Re-export/import after changing your answers.

Permissions are `activeTab`, `scripting` and `storage`, plus access to `https://ducle1218.github.io/*` for the public portfolio, with a content script restricted to Application Studio on ducle1218.github.io. Optional HTTPS host access is declared for employer forms, but requested only for the single origin selected at launch. There is no blanket access request. Revoke individual site grants in the browser’s extension settings. This does not use a remote browser service.

Supported: visible text fields, textareas, native selects and accessible custom comboboxes with exact, unambiguous options. Existing values and selected files are preserved. Common answers saved in Studio support sex, pronouns, separate age thresholds, US work authorization, sponsorship, referral source, relocation, travel, enrollment and availability. Demographic and eligibility answers start unchecked for per-application review; nothing is inferred. Passwords, signatures, legal attestations, arbitrary checkboxes and submission controls are never filled. Inaccessible widgets and embedded cross-origin frames may require manual entry. Chrome/Edge desktop support unpacked extensions; normal mobile browsers do not.


## Remember answers

After answering questions on an employer form, click **Remember my answers** in the helper panel or popup. It reads supported completed fields only when clicked. Review and edit the answers, uncheck anything you do not want to keep, choose **All employers** or **This employer only**, and save. Without a connected job, restricted answers are tied to that page instead.

Future scans suggest exact matches and supported equivalent wording, such as “When can you start?” / “What is your earliest available start date?”. Suggestions show the original question. Conflicting answers and changed dates, numbers or negations are not guessed. Shared job-board domains do not mix company-specific answers. Sensitive answers are not harvested into answer memory. Add supported common questions explicitly in Studio; legal attestations remain manual.

**Manage saved answers** opens search, editing, deletion, and backup/import. Answers stay in extension storage on this browser. Normal cache clearing and updating in place preserve them; uninstalling removes them. This library does not sync to the portfolio database or other devices. Export a private backup when moving browsers.

## Drag-and-drop updates

Install 1.2 once by replacing the old folder files and clicking **Reload** in Chrome/Edge. After that, open the extension popup → **Update helper · drop a ZIP**. Download the latest ZIP from Studio and drop it onto the update screen. Choose the SAME folder used for Load unpacked, confirm it, click **Replace extension files**, then **Reload helper** after finishing active applications. No uninstall or re-import is needed.

The updater remembers the folder; the browser may ask for write permission again. It checks the archive against the SHA-256 and file list published on your GitHub Pages site, rejects older/corrupt/path-traversal packages, backs up affected files in memory, and restores them on write failure when possible. It never deletes the extension directory or changes browser extension storage. Internet access is required to verify a release. If the folder picker is unavailable, extract the ZIP over the existing folder and use the browser’s Reload button.

This is an explicit drag-and-drop update flow. No Windows task, background downloader, enterprise policy, or remotely executed script is installed.

The same updater is available at https://ducle1218.github.io/Duc-Le-Portfolio/applications/update/ for upgrading an older helper that does not yet have its own update screen. Select the existing loaded folder, drop the latest ZIP, replace, then use Reload on the browser extension card.


## Which file goes where?

The optional **Choose exported profile** control accepts **Duc_Application_Profile.json**, downloaded from Studio’s **Export profile (manual fallback)** button after saving your profile. `manifest.json` is extension configuration, not your profile. **Application-Helper.zip** belongs in **Update helper**. The normal connection flow needs no upload: open Studio, save your profile, and start an application.

Profiles imported manually or received from Studio, plus saved answers, persist across computer restarts in this browser. The temporary connection to a particular application still expires. Keep the extension installed; uninstalling it clears its local data.

## Tailored resume attachment

Keep **Bring a resume tailored to this job** checked when starting from Studio. Studio builds from that posting’s description, preserves the original resume template, and sends the PDF with that job’s tab handoff. The PDF is not saved to the public website or backend. The handoff validates the job URL, PDF header, size and digest; the upload rechecks the digest. **Fill selected** attaches only to one clearly labelled resume/CV input that accepts PDF. Existing files, multiple ambiguous uploaders, cover letters and unsupported widgets are left alone. Some employers upload immediately when a file is selected. Final application submission remains yours.

A popup opened on a different domain cannot use a previous employer’s PDF. Restart from Studio on the correct application URL, or download and attach the PDF manually. Profile-only imports do not include a resume. Update in place to 1.6.0 and refresh Studio; no new extension permissions are required.

## Dependent dropdowns and radio groups
Version 1.4 uses the same control scanner for filling and remembering. It supports native radio groups and accessible custom dropdowns, including common Angular and Bootstrap-style controls. Fill the parent choice, then scan again to review any follow-up questions. Existing selections are preserved; the helper never clicks Continue or Submit.

In Studio, use **Add my background answers** to add the supplied school, degree, employment, research and residence facts. Review, confirm, and save or download the updated profile. These answers remain editable. No work experience is not used to answer project-experience, prior-application, citizenship, sponsorship or legal-agreement questions.

## Identity answers and connecting an open application
Gender wording now matches the saved Sex answer. Paragraph-led radio groups and option descriptions are handled separately. Race/ethnicity and citizenship can be remembered only from answers you select and explicitly save; they are never inferred from residence. The explicitly requested Male answer is selected for filling when present in the confirmed profile. Remembered race and citizenship suggestions start unchecked for review. Generic country follow-ups without context are not reused as citizenship answers.

Use **Connect a tailored resume** in the popup if an application was opened directly or moved to another employer domain. Allow access to that page, choose the same job in Studio, confirm it matches the open application, and connect its PDF. The application tab is preserved. The connection expires after 30 minutes and requires a fresh connection after expiry or a domain change.

The connected job-specific PDF attaches once when a single supported empty resume file input appears. This includes hidden file inputs labelled by an Upload your resume page heading. Existing files, ambiguous upload controls and unsupported frames stay manual. A profile JSON alone does not contain a resume. No Continue or Submit button is clicked.

## Version 1.6

Selectize, Tom Select, and UI Select controls are treated as dropdown widgets, with mouse-down selection and read-back verification. Editable date/month fields preserve the employer format and bounds.

Choose the application season before scanning a full-time question. Summer 2027 is full-time; fall/winter are not. Unknown seasons stay manual. Summer dates and preferred application source are editable under Saved answers and included in exports. The summer dates expire instead of rolling forward silently.

Inference uses confirmed facts and shows its source: 18+ can meet a 16+ minimum; New Jersey residence implies United States residence. Conflicting facts, citizenship/work authorization, and unproven higher age thresholds stay manual. Availability ranges that overlap a semester need manual review.

## Version 1.7 — Portfolio knowledge

The helper fetches the portfolio’s public structured project data and matching resume skill index. A confirmed profile is still required, but questions about documented skills, education and relevant project work can now be answered without adding them to the question bank. Saved answers take priority.

New portfolio suggestions start unchecked. Expand **Why this answer · portfolio sources** to review supporting quotations and project links, then select the answer to fill. Project drafts preserve individual contributions and unfinished status. Unknown skills, years of experience, certifications and legal or identity facts are not guessed. This is local evidence-based inference, not an external AI service. No form answers or private profile are sent to the portfolio.

The popup shows **Portfolio knowledge** with a refresh button. Public facts refresh after six hours; offline copies expire after seven days. The source review date is shown separately from the fetch date. Existing profile and saved answers continue working when the portfolio is unavailable.

Update using the latest ZIP in the same extension folder, reload the helper and refresh the employer form. Chrome may ask you to allow the new portfolio-site permission.
