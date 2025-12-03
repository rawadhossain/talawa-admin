## Issue: Fix Docker Build Error Messages
Description:
Describe the bug:

We recently migrated the app from using npm to pnpm
Migrate the repository to PNPM #4619
fix: pnpm-migration #4745
The docker build now produces a series of errors that need to be fixed
To Reproduce

Steps to reproduce the behavior:

Install the app using docker
Errors appear
Expected behavior

Install the app using docker
- Errors do not appear.
- The errors are not suppressed
 -  errors do not appear because they have been rectified according to the package owners' best practice recommendations.
- No functionality of the app is altered
- All tests pass and are valid
Actual behavior: 

1. Fix dependencies that should be allowed to run scripts:
```
#9 33.37 + vite 7.2.4
#9 33.37 + vite-plugin-istanbul 7.2.1
#9 33.37 + vite-plugin-svgr 4.5.0
#9 33.37 + vitest 3.2.4 (4.0.12 is available)
#9 33.37 
#9 33.37 Warning:
Ignored build scripts: @parcel/watcher, core-js, cypress, esbuild.       
 Run "pnpm approve-builds" to pick which dependencies should be allowed   
 to run scripts.
 ```
2. Fix PDFme and form-render dependencies:
```
#9 33.37 .
#9 33.37 ├─┬ @pdfme/schemas 5.4.8
#9 33.37 │ └── ✕ unmet peer @pdfme/common@latest: found 5.4.8
#9 33.37 ├─┬ @pdfme/generator 5.4.8
#9 33.37 │ ├── ✕ unmet peer @pdfme/common@latest: found 5.4.8
#9 33.37 │ └── ✕ unmet peer @pdfme/schemas@latest: found 5.4.8
#9 33.37 └─┬ form-render 2.5.6
#9 33.37   ├─┬ rc-color-picker 1.2.6
#9 33.37   │ ├── ✕ unmet peer react@16.x: found 19.2.0
#9 33.37   │ └── ✕ unmet peer react-dom@16.x: found 19.2.0
#9 33.37   └─┬ virtualizedtableforantd4 1.3.1
#9 33.37     ├── ✕ unmet peer react@"^16.8.0 || ^17.0.0 || ^18.0.0": found 19.2.0
#9 33.37     └── ✕ unmet peer react-dom@"^16.8.0 || ^17.0.0 || ^18.0.0": found 19.2.0
```
3. Fix dynamic / static importations:
```
#11 64.93 [plugin vite:reporter] 
#11 64.93 (!) /usr/src/app/src/plugin/services/AdminPluginFileService.ts is dynamically imported by /usr/src/app/src/screens/PluginStore/hooks/usePluginActions.ts but also statically imported by /usr/src/app/src/screens/PluginStore/PluginModal.tsx, /usr/src/app/src/utils/adminPluginInstaller.ts, dynamic import will not move module into another chunk.
#11 64.93 
#11 66.19 [plugin vite:reporter] 
#11 66.19 (!) /usr/src/app/src/screens/PageNotFound/PageNotFound.tsx is dynamically imported by /usr/src/app/src/App.tsx but also statically imported by /usr/src/app/src/components/Advertisements/core/AdvertisementRegister/AdvertisementRegister.tsx, /usr/src/app/src/components/SecuredRoute/SecuredRoute.tsx, /usr/src/app/src/components/UserPortal/SecuredRouteForUser/SecuredRouteForUser.tsx, dynamic import will not move module into another chunk.
#11 66.19 
#11 66.19 [plugin vite:reporter] 
#11 66.19 (!) /usr/src/app/src/plugin/registry.tsx is dynamically imported by /usr/src/app/src/App.tsx, /usr/src/app/src/plugin/managers/lifecycle.ts but also statically imported by /usr/src/app/src/plugin/components/PluginInjector.tsx, /usr/src/app/src/plugin/index.ts, /usr/src/app/src/plugin/routes/PluginRouteRenderer.tsx, dynamic import will not move module into another chunk.
```