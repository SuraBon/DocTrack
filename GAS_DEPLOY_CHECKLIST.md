# GAS Deploy Checklist

Use this after updating `google_apps_script.js`.

1. Deploy the updated Apps Script code.
2. Run `setup()` from the Apps Script editor.
3. Confirm the spreadsheet has a `Branches` sheet.
4. Confirm the `Users` sheet has these columns:
   - `Status`
   - `UpdatedAt`
5. Smoke test these actions from the app or Apps Script test payloads:
   - `getBranches`
   - `createBranch`
   - `deleteBranch`
   - `updateUser`
   - `disableUser`
   - `deleteUser`
6. Create one parcel and confirm the tracking number still uses the existing `TRKYYYYMMDD...` format.

No automatic data clearing is required. Existing parcel rows and historical department/branch text should remain unchanged.
