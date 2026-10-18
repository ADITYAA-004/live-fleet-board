# Demo video submission and packaging

The user reports that the required video has been recorded and is being edited. No final MP4 was found in the repository. Do not create an empty or placeholder video. Use DEMO_SCRIPT.md for the spoken outline and live demonstration. The submission requires a 5–10 minute video covering what I chose and why, alternatives and why I rejected them, what I predict will break at 10× scale, and one real incorrect AI suggestion with how I handled it.

## OBS recording checklist

1. Create a Display Capture source and select the monitor containing the browser and terminals. Confirm the capture shows the full dashboard and readable terminal output.
2. Select the microphone I will narrate into. Speak and confirm the OBS audio meter moves; listen to a test recording to confirm the correct microphone is captured.
3. Set the recording format to MP4 and choose the recording directory. Use the planned filename live-fleet-board-demo.mp4.
4. Make a 30-second test recording. Play it back and check the picture, narration, system audio if needed, and synchronization before recording the final take.
5. Arrange Chrome at http://localhost:5173 beside the server terminal and another terminal. Keep bus rows, the metrics panel, the Trigger burst now button, and server logs readable. Do not cover the BUS-07 out-of-order log line.
6. Record the demo using DEMO_SCRIPT.md. Read the actual values visible during this take; do not substitute historical readings.
7. Play back the final file. Check the duration is 5–10 minutes, the narration is audible throughout, and the required scenes and four discussion topics are present.
8. Save the final recording to submission/live-fleet-board-demo.mp4 or the assignment's approved location. This MP4 path is ignored by Git; upload it separately.

## Final packaging checklist

- From the repository root, run npm test and npm run load-test and keep the real output for the submission. Run npm run build --workspace=client if the evaluator expects a build result.
- Check git status and git log -1. Commit and push only changes approved by the repository owner; do not report a clean or published state without checking it.
- If a repository ZIP is required, exclude node_modules, client/node_modules, and client/dist. Preserve .git only if the assignment explicitly requests Git history. Inspect the archive listing before uploading.
- Upload the video to the assignment service or an approved file share. If using Google Drive, grant “Anyone with the link” Viewer access and test the link in a private/incognito browser window.
- Attach DECISIONS.md, README.md, the required source/scripts, and the real AI transcript files. docs/ai-transcript/ contains three exported Codex sessions and two setup notes. The separate planning-assistant conversation cited in the AI Suggestions Log is not present as a standalone transcript; if it is required, copy/export the original complete conversation to docs/ai-transcript/planning-chat.md. Do not create a transcript from memory.
- Enter two to four assumptions from DECISIONS.md in the submission form.
- The user's actual project-time report is 15 hours; use that value if the submission form requests hours.
- Use docs/FINAL_SUBMISSION_CHECKLIST.md to confirm each deliverable and any required upload link. Do not call the project fully submitted until the video and required files have been delivered and checked.

## Planned video path

    submission/live-fleet-board-demo.mp4

See ../DEMO_SCRIPT.md for the 9-minute outline and live checklist.
