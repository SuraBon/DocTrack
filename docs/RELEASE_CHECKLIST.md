# Release checklist (ShipTrack)

## Before deploy

- [ ] Run `pnpm run check` (TypeScript)
- [ ] Run `pnpm run test:run` (Vitest)
- [ ] Run `pnpm run build` and smoke-test `/track`, dashboard, confirm receipt
- [ ] Deploy updated GAS bundle (`pnpm run build:gas`) if `gas-src/` changed
- [ ] Verify Script Properties: `API_KEY`, year spreadsheets, folder IDs

## IndexedDB

- Current DB: `shiptrack_offline` version **5**
- Stores: `offlineQueue`, `offlineMedia`, `drafts`, `createdParcelHistory`, `parcelsCache`
- If schema changes: bump `DB_VERSION` in `client/src/lib/offlineDb.ts` and add `onupgradeneeded` migration

## GAS maintenance

- Monitor `AuditLog` for action failures / spikes

## PWA

- Background sync is **best-effort**: requires Chromium + registered SW tag `shiptrack-offline-sync`
- Foreground sync still runs on: online, tab visible, 30s interval

## Rollback

- Revert client deploy (GitHub Pages artifact / previous commit)
- Revert GAS deployment to prior script version in Apps Script console
- Client offline queue is local — rollback does not delete queued items
