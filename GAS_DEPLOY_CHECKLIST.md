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

## Troubleshooting Common Setup Errors

- **Error: "เกิดข้อผิดพลาดที่ไม่รู้จัก โปรดลองอีกครั้งในภายหลัง" (An unknown error occurred. Please try again later.)**
  - **Cause:** This usually occurs due to Google account session conflicts when signed into multiple Google accounts in the same browser.
  - **Solution:** Open the Apps Script editor in an **Incognito window (หน้าต่างไม่ระบุตัวตน)**, log in with only the account owning the script, and run it again.

- **Error: "Error: Set Script Property ADMIN_INITIAL_PIN before running setup/resetDefaultAdminPassword"**
  - **Cause:** The script needs an initial PIN for the admin account which is retrieved from Script Properties.
  - **Solution:** Go to **Project Settings** (⚙️) on the left panel, scroll down to **Script Properties**, add a property with the name `ADMIN_INITIAL_PIN` and a secure PIN (4+ characters, alphanumeric/symbols) as the value, click **Save script properties**, and run `setup()` again.

