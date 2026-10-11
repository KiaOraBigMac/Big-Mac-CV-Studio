# Big Mac CV Builder — browser-based CV builder

A static, browser-based CV editor inspired by the original Python/PySide6 Big Mac CV Builder. It requires no Python server.

## Run locally

1. Extract this folder to your computer, for example `C:\Users\YOURNAME\Desktop\Big Mac CV BuilderWeb`.
2. Open the folder in VS Code.
3. Open `index.html` in a browser. Recommended: install the VS Code **Live Server** extension, right-click `index.html`, and choose **Open with Live Server**.
4. Internet access is required to load the DOCX export library from its CDN. Editing, preview, local autosave, `.fcv` project files and print-to-PDF work without a backend.

## Included in this prototype

- Formal Black & White, Modern and Classic visual styles
- Single- and two-column layouts
- Colour presets/custom accent colour, font, font size and page margins
- Personal details, summary, experience, education, projects, skills and certifications
- Live A4 preview and zoom controls
- Export PDF via the browser's Print dialog (choose **Save as PDF**)
- Export editable DOCX
- Import/export `.fcv` project JSON and local browser autosave

## Important notes

- This is a functional prototype, not a production-audited commercial release.
- Local autosave is tied to the current browser/device. Export `.fcv` backups before clearing browser data or switching devices.
- The PDF export opens the browser print dialog. In the dialog choose paper size **A4**, destination **Save as PDF**, and enable background graphics only if desired.
- The DOCX export library is loaded from a third-party CDN. For a commercial launch, pin and self-host a reviewed library version, test browser compatibility, add automated tests, and publish a privacy notice and terms.
