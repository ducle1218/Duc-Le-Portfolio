# Application Helper 1.2.1 — Chrome and Edge

1. Download the ZIP from Application Studio and extract it.
2. Open `chrome://extensions` or `edge://extensions`, turn on Developer mode, choose **Load unpacked**, and select the extracted folder containing `manifest.json`.
3. Refresh Application Studio, unlock owner access, review and save your profile. No export is needed for the connected workflow.
4. Choose a job’s **Prepare application**, then **Start application with helper**. On first use, allow access to that employer’s site in the extension’s launch screen.
5. Open the employer's actual application form or sign in. The helper panel recognizes supported fields. Review the suggestions and choose **Fill selected**. Attach your tailored PDF and submit yourself.

To update from 1.0, replace the old extracted files, click **Reload** on its extension card, and refresh Application Studio. If an employer redirects to a different domain, click the extension icon and **Scan current form** there. No profile is automatically injected into a different origin. New tabs opened by an employer are not automatically linked: start that application URL from Studio, or use manual import.

Your latest confirmed Studio profile is also saved in extension local storage, so it remains available after closing the browser or restarting the computer. The job-specific handoff stays in session storage for 30 minutes, scoped to its launched tab. Closing that tab or ending the helper removes the handoff; browser restart or extension reload clears session storage. No library key is included. Suggestions are matched locally, not sent to an AI service. Filling writes only selected answers into the employer’s form. Employers may save entered fields before final submission.

Manual fallback: export your profile JSON from Studio and import it through the extension popup. Imported profiles remain in local extension storage until **Forget profile**. Re-export/import after changing your answers.

Permissions are `activeTab`, `scripting` and `storage`, with a content script restricted to Application Studio on ducle1218.github.io. Optional HTTPS host access is declared for employer forms, but requested only for the single origin selected at launch. There is no blanket access request. Revoke individual site grants in the browser’s extension settings. This does not use a remote browser service.

Supported: visible standard text fields, textareas and native dropdowns with exact matches. Existing values are preserved. Passwords, sensitive eligibility/demographic/legal fields, checkboxes and submission controls are not filled. Embedded cross-origin frames, custom controls and file uploads need manual handling. Chrome/Edge desktop support unpacked extensions; normal mobile browsers do not.


## Remember answers

After answering questions on an employer form, click **Remember my answers** in the helper panel or popup. It reads supported completed fields only when clicked. Review and edit the answers, uncheck anything you do not want to keep, choose **All employers** or **This employer only**, and save. Without a connected job, restricted answers are tied to that page instead.

Future scans suggest exact matches and supported equivalent wording, such as “When can you start?” / “What is your earliest available start date?”. Suggestions show the original question. Conflicting answers and changed dates, numbers or negations are not guessed. Shared job-board domains do not mix company-specific answers. Sensitive/legal fields remain manual.

**Manage saved answers** opens search, editing, deletion, and backup/import. Up to 200 answers stay in extension storage on this browser. Normal cache clearing and updating in place preserve them; uninstalling removes them. This library does not sync to the portfolio database or other devices. Export a private backup when moving browsers.

## Drag-and-drop updates

Install 1.2 once by replacing the old folder files and clicking **Reload** in Chrome/Edge. After that, open the extension popup → **Update helper · drop a ZIP**. Download the latest ZIP from Studio and drop it onto the update screen. Choose the SAME folder used for Load unpacked, confirm it, click **Replace extension files**, then **Reload helper** after finishing active applications. No uninstall or re-import is needed.

The updater remembers the folder; the browser may ask for write permission again. It checks the archive against the SHA-256 and file list published on your GitHub Pages site, rejects older/corrupt/path-traversal packages, backs up affected files in memory, and restores them on write failure when possible. It never deletes the extension directory or changes browser extension storage. Internet access is required to verify a release. If the folder picker is unavailable, extract the ZIP over the existing folder and use the browser’s Reload button.

This is an explicit drag-and-drop update flow. No Windows task, background downloader, enterprise policy, or remotely executed script is installed.

The same updater is available at https://ducle1218.github.io/Duc-Le-Portfolio/applications/update/ for upgrading an older helper that does not yet have its own update screen. Select the existing loaded folder, drop the latest ZIP, replace, then use Reload on the browser extension card.


## Which file goes where?

The optional **Choose exported profile** control accepts **Duc_Application_Profile.json**, downloaded from Studio’s **Export profile (manual fallback)** button after saving your profile. `manifest.json` is extension configuration, not your profile. **Application-Helper.zip** belongs in **Update helper**. The normal connection flow needs no upload: open Studio, save your profile, and start an application.

Profiles imported manually or received from Studio, plus saved answers, persist across computer restarts in this browser. The temporary connection to a particular application still expires. Keep the extension installed; uninstalling it clears its local data.
