# Video Editing Plan — Live Fleet Board

## Source assets and limits

- **Primary recording to use:** the user-reported 7:32 demo recording described in `CHANGES_LOG.md`. The log says it contains an automatic burst around 1:40. The recording file itself was not found in the project or `submission/`, so I could not inspect or edit it here.
- **Add-on material:** `submission/VIDEO_ADDON_SCRIPT.md` is available as a script. No separate add-on video footage was found. Record the add-on narration/screen footage if it has not already been recorded.
- **Editing capability:** no video files were accessible and `ffmpeg` is not installed in this environment, so no merge/export was attempted.

## Proposed edit

Use the reported 7:32 recording as the main source. Preserve the automatic-burst scene around 1:40 and the visible metrics it captures. Trim only dead air, loading waits, repeated explanations, or unreadable transitions after inspecting the actual video. Do not remove the original reading or change what it appears to show.

Insert the add-on narration from `VIDEO_ADDON_SCRIPT.md` after the live demonstration and before the closing summary. Cover the alternatives and why they were rejected, the measured-versus-predicted 10× scale discussion, and the real AI Suggestions Log examples. Use the existing `DEMO_SCRIPT.md` as the content checklist. Keep actual browser/server values visible during the recording and describe historical test values as historical.

Aim for a final runtime around 8–9 minutes, while keeping the verified exported duration between 5 and 10 minutes. This is an editing target, not a measured duration for footage that was unavailable here. If the add-on would push the total over 10 minutes, tighten pauses and repeated material without removing required topics.

## Suggested sequence

1. Brief project introduction and chosen architecture.
2. Normal dashboard traffic and the measured panel.
3. Preserve the recorded automatic burst; show the out-of-order server log and stale rejection behavior where available.
4. Add the button-triggered burst only if it is in the source recording; show the table and metrics responding.
5. Explain alternatives, the freshness-over-complete-motion trade-off, and what is predicted to break at 10× scale.
6. Explain one or more real entries from the AI Suggestions Log and close with limitations.

## Export and delivery checks

- Export as MP4; use 1080p and 30 fps when supported by the source/editor.
- Play the exported file from beginning to end. Check duration (5–10 minutes), audio clarity, readable text, and that the required sections are present.
- Upload the final MP4 to Google Drive. Set access to **Anyone with the link — Viewer**, then test the link in a private/incognito window.
- Planned local path: `submission/live-fleet-board-demo.mp4`. Do not treat this file as present until it has actually been exported.