# Fix Build Errors TODO

## Issues to Fix:

1. **Missing Firebase dependency** - Add `firebase` to package.json
2. **Wrong import path in PaymentsPage.tsx** - Fix `./notificationSlice` to `../notifications/notificationSlice`
3. **Wrong import path in slices.ts** - Fix `../../api/services` to `../api/services`

## Steps:

- [x] 1. Add firebase dependency to package.json
- [x] 2. Fix import path in PaymentsPage.tsx
- [x] 3. Fix import path in slices.ts
- [x] 4. Run npm install to install firebase
- [x] 5. Run npm start to verify fixes - COMPILED SUCCESSFULLY!
