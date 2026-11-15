# Application Helper 1.1 — Chrome and Edge

1. Download the ZIP from Application Studio and extract it.
2. Open `chrome://extensions` or `edge://extensions`, turn on Developer mode, choose **Load unpacked**, and select the extracted folder containing `manifest.json`.
3. Refresh Application Studio, unlock owner access, review and save your profile. No export is needed for the connected workflow.
4. Choose a job’s **Prepare application**, then **Start application with helper**. On first use, allow access to that employer’s site in the extension’s launch screen.
5. Open the employer's actual application form or sign in. The helper panel recognizes supported fields. Review the suggestions and choose **Fill selected**. Attach your tailored PDF and submit yourself.

To update from 1.0, replace the old extracted files, click **Reload** on its extension card, and refresh Application Studio. If an employer redirects to a different domain, click the extension icon and **Scan current form** there. No profile is automatically injected into a different origin. New tabs opened by an employer are not automatically linked: start that application URL from Studio, or use manual import.

Connected profiles stay in extension session storage for 30 minutes, scoped to the launched tab. Closing that tab or ending the helper removes the handoff; browser restart or extension reload clears session storage. No library key is included. Suggestions are matched locally, not sent to an AI service. Filling writes only selected answers into the employer’s form. Employers may save entered fields before final submission.

Manual fallback: export your profile JSON from Studio and import it through the extension popup. Imported profiles remain in local extension storage until **Forget profile**. Re-export/import after changing your answers.

Permissions are `activeTab`, `scripting` and `storage`, with a content script restricted to Application Studio on ducle1218.github.io. Optional HTTPS host access is declared for employer forms, but requested only for the single origin selected at launch. There is no blanket access request. Revoke individual site grants in the browser’s extension settings. This does not use a remote browser service.

Supported: visible standard text fields, textareas and native dropdowns with exact matches. Existing values are preserved. Passwords, sensitive eligibility/demographic/legal fields, checkboxes and submission controls are not filled. Embedded cross-origin frames, custom controls and file uploads need manual handling. Chrome/Edge desktop support unpacked extensions; normal mobile browsers do not.
