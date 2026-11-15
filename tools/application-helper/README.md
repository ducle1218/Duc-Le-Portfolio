# Application Helper — Chrome and Edge

1. Download the ZIP from Application Studio and extract it.
2. Open `chrome://extensions` or `edge://extensions`, turn on Developer mode, choose **Load unpacked**, and select the extracted folder containing `manifest.json`.
3. In Application Studio, unlock owner access, review and save your profile, then choose **Export for extension**.
4. Click the extension, import that JSON, and open an employer's actual application form.
5. Choose **Scan current form**, review the suggestions, and choose **Fill selected answers**. Review the form yourself before submitting.

The profile is stored locally by the extension, not sent to an AI service. Use **Forget profile** to remove it; export/import again after changing your online profile. The export contains your confirmed details, so treat it as a private file.

Permissions are `activeTab`, `scripting` and `storage`. There are no all-sites permissions, host permissions, background scripts or automatic scans. Access is granted to the current page when you click the extension.

Supported: visible standard text fields, textareas and native dropdowns with exact matches. Existing values are preserved. Passwords, sensitive eligibility/demographic/legal fields, checkboxes and submission controls are not filled. Embedded cross-origin frames, custom controls and file uploads need manual handling. Chrome/Edge desktop support unpacked extensions; normal mobile browsers do not.
