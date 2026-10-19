# Live Fleet Board — Final Submission Checklist

Updated: 2026-10-18. Deadline: 21 October 2026, 3:20 PM IST. Local preparation and automated checks were run in this workspace. This is not a claim that the video or submission form has been delivered.

| Requirement | Status | Evidence / remaining action |
|---|---|---|
| Final source code ZIP verified | DONE | `submission/live-fleet-board-code.zip` was rebuilt from the current tracked project files after preserving the prior archive as `live-fleet-board-code-backup.zip`. Required source/docs/transcript paths are present, the archived `DECISIONS.md` matches the current file, and forbidden generated/private paths were excluded. |
| GitHub repository link checked | DONE | `origin` points to `https://github.com/ADITYAA-004/live-fleet-board.git`; a read-only `git ls-remote ... HEAD` returned a commit. This verifies the configured URL is reachable, not repository visibility. |
| `DECISIONS.md` has exactly four assumptions | DONE | The assumptions section has four bullets; each states the assumption and what could fail. `Hours spent: 15` is retained. |
| Automated test results recorded | DONE | `npm test`: 24 passed, 0 failed. `npm run build --workspace=client`: passed, 22 modules. `npm run load-test`: all checks passed; fresh run details are in `CHANGES_LOG.md`. |
| Separate AI transcript ZIP verified | DONE | `submission/live-fleet-board-ai-transcripts.zip` opens and contains the five existing transcript Markdown files under `docs/ai-transcript/`. This is the available transcript set, not a claim that it captures every AI interaction. |
| Final walkthrough video is 5–10 minutes | PENDING — MANUAL | The user-reported 7:32 recording is not accessible as a video file in this workspace. Locate the original, complete edits, then verify the exported duration and playback. |
| Final video uploaded to Google Drive | PENDING — MANUAL | Upload the final MP4 after playback checks. |
| Drive sharing is “Anyone with the link — Viewer” | PENDING — MANUAL | Set the permission and test the link in a private/incognito window. |
| Form answers reviewed and form submitted before deadline | PENDING — MANUAL | Review `submission/FORM_ANSWERS.txt`, fill the video URL and any unknown fields, then submit the actual form before the deadline. |
| Separate planning-assistant transcript included, if required | MISSING / CHECK REQUIREMENT | `docs/ai-transcript/planning-chat.md` is not present. Add only the original transcript if the assignment requires it; do not reconstruct it. |

## Manual completion order

1. Locate the original user-reported 7:32 recording and any add-on footage. Follow `submission/VIDEO_EDITING_PLAN.md` and `submission/VIDEO_ADDON_SCRIPT.md`.
2. Export the final video and play it through. Confirm it is 5–10 minutes, has audible narration, and includes the required topics and demo evidence.
3. Upload the final MP4 to Google Drive. Set “Anyone with the link — Viewer” and test access in a private/incognito window.
4. Attach or upload `submission/live-fleet-board-code.zip` and any other required documents to the assignment portal. The ZIP is prepared locally; portal delivery is not verified.
5. If required, place the original planning-assistant transcript in `docs/ai-transcript/` and refresh the transcript archive. Do not reconstruct it.
6. Review `submission/FORM_ANSWERS.txt`, add the real video URL and any unknown answers from the actual form, submit it, and retain its confirmation.

The project is not fully submitted until the video and form steps are completed and verified.