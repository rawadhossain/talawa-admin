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

## Solved By Me (Changed portion of the files):
Dockerfiles chnage for (Fix dependencies that should be allowed to run scripts)
1. Dockerfile.deploy:
```
###############################################################################
#
# DO NOT EDIT!!!
#
# This file is used to deploy the https://test.talawa.io site
#
###############################################################################
FROM node:24-slim AS build

ARG PORT=4321
ENV PORT=${PORT}
ENV NODE_ENV=production

# Enable pnpm globally
RUN corepack enable

WORKDIR /usr/src/app

# Copy dependency manifests
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN corepack prepare pnpm@10.4.1 --activate \
    && pnpm install --frozen-lockfile --reporter=append-only

# Copy full project
COPY . .

# Build the project
RUN pnpm run build

EXPOSE ${PORT}
CMD ["pnpm", "run", "serve"]
```
2. Dockerfile.dev:
```
FROM node:24-slim AS build

ARG PORT=4321
ENV PORT=${PORT}

# Enable pnpm globally
RUN corepack enable

WORKDIR /usr/src/app

# Copy dependency manifests only
COPY package.json pnpm-lock.yaml ./

RUN corepack prepare pnpm@10.4.1 --activate \
    && pnpm install --frozen-lockfile --reporter=append-only

# Copy the project
COPY . .

# Build the app
RUN pnpm run build

EXPOSE ${PORT}
CMD ["pnpm", "run", "serve"]
```
3. Dockerfile.prod:
```
# Step 1: Build Stage
FROM node:24-slim AS builder
WORKDIR /talawa-admin

# Enable pnpm globally
RUN corepack enable

# Copy dependency manifests
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN corepack prepare pnpm@10.4.1 --activate \
    && pnpm install --frozen-lockfile --reporter=append-only

# Copy source code
COPY . .

ENV NODE_ENV=production

# Build Vite production bundle
RUN pnpm run build

# 2. Nginx Production Server
FROM nginx:1.27.4-alpine AS production

ENV NODE_ENV=production

# Copy nginx config
COPY config/docker/setup/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=builder /talawa-admin/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

4. package.json change for (Fix PDFme and form-render dependencies)
```
...
"lcov-result-merger": "^5.0.1",
"packageManager": "pnpm@10.4.1"
  "pnpm": {
    "overrides": {
      "@apollo/client": "3.13.0",
      "@pdfme/common": "5.4.8",
      "@pdfme/schemas": "5.4.8",
      "@pdfme/generator": "5.4.8",
      "rc-color-picker>react": "^19.1.0",
      "rc-color-picker>react-dom": "^19.1.0",
      "virtualizedtableforantd4>react": "^19.1.0",
      "virtualizedtableforantd4>react-dom": "^19.1.0",
      "@types/react": "^19.1.1",
      "@types/react-dom": "^19.1.1",
      "whatwg-url": "^14.0.0",
      "core-js": "^3.40.0",
      "sync-fetch": "npm:@ardatan/sync-fetch@0.0.1",
      "gulp-header": "^2.0.9",
      "rimraf": "^6.1.2",
      "glob": "^13.0.0",
      "nyc": "17.1.0"
    },
    "peerDependencyRules": {
      "allowedVersions": {
        "react": ">=16",
        "react-dom": ">=16"
      },
      "ignoreMissing": [
        "react",
        "react-dom",
        "@pdfme/common",
        "@pdfme/schemas"
      ]
    },
    "onlyBuiltDependencies": [
      "esbuild",
      "@parcel/watcher",
      "core-js",
      "cypress",
      "sharp"
    ]
  }
```
5. Fix dynamic / static importations in some files:
- AdvertisementRegister.tsx
```
import React, { useState, useEffect, lazy, Suspense } from 'react';
import Loader from 'components/Loader/Loader';
const PageNotFound = lazy(() => import('screens/PageNotFound/PageNotFound'));
 ...
return (
      <Suspense fallback={<Loader />}>
        <PageNotFound />
      </Suspense>
    );
```

- SecuredRoute.tsx
```
import Loader from 'components/Loader/Loader';
import React, { lazy, Suspense, useEffect, useRef } from 'react';
// LAZY import to prevent Vite static/dynamic import conflict
const PageNotFound = lazy(() => import('screens/PageNotFound/PageNotFound'));
 ...
 if (intervalRef.current) clearInterval(intervalRef.current);
 ...
    <>
      {role === 'administrator' ? (
        <Outlet />
      ) : (
        <Suspense fallback={<Loader />}>
          <PageNotFound />
        </Suspense>
      )}
    </>
```

- SecuredRouteForUser.tsx
```
import React, { lazy, Suspense, useEffect, useRef } from 'react';
import Loader from 'components/Loader/Loader';
// LAZY import to avoid mixing static + dynamic imports
const PageNotFound = lazy(() => import('screens/PageNotFound/PageNotFound'));
 ...
 if (intervalRef.current) clearInterval(intervalRef.current);
 ...
    <>
      {adminFor === null ? (
        <Outlet />
      ) : (
        <Suspense fallback={<Loader />}>
          <PageNotFound />
        </Suspense>
      )}
    </>
```

- usePluginActions.ts (only the changed lines by replacing with old code)
```
import { adminPluginFileService } from 'plugin/services/AdminPluginFileService';
interface IPluginGraphQLItem {
  id: string;
  pluginId: string;
  isActivated?: boolean;
}
interface IUsePluginActionsProps {
  pluginData?: { getPlugins: IPlugin[] };
  pluginData?: {
    getPlugins?: IPluginGraphQLItem[];
  };
  refetch: () => Promise<unknown>;
}
 // SAFELY normalize pluginData
  const plugins = pluginData?.getPlugins ?? [];
   await installPlugin({
          variables: {
            input: {
              pluginId: plugin.id,
            },
            input: { pluginId: plugin.id },
          },
        });
if (!success) throw new Error('Failed to install plugin');
 const existingPlugin = plugins.find((p) => p.pluginId === plugin.id);
if (!success) throw new Error('Failed to toggle plugin');
[plugins, updatePlugin, refetch],

 const existingPlugin = plugins.find(
        (p) => p.pluginId === pluginToUninstall.id,
      );

await deletePlugin({
          variables: {
            input: {
              id: existingPlugin.id,
            },
            input: { id: existingPlugin.id },
          },
        });
  await adminPluginFileService.removePlugin(pluginToUninstall.id);
        } catch (err) {
          console.error('Failed to remove plugin directory:', err);

}, [plugins, pluginToUninstall, deletePlugin, refetch]);
```

- lifecycle.ts
```
import { ILoadedPlugin, IPluginLifecycle, PluginStatus } from '../types';
import { registerPluginDynamically } from '../registry';
 const lifecycle = defaultExport as IPluginLifecycle;
 ...
```

- PluginModal.tsx
```
import { AdminPluginFileService } from 'plugin/services/AdminPluginFileService';
```

- adminPluginInstaller.ts (attaching full file)
```
import JSZip from 'jszip';
import {
  UPLOAD_PLUGIN_ZIP_MUTATION,
  CREATE_PLUGIN_MUTATION,
} from '../GraphQl/Mutations/PluginMutations';
import { adminPluginFileService } from 'plugin/services/AdminPluginFileService';

interface IUploadPluginZipResponse {
  data?: {
    uploadPluginZip?: {
      id: string;
      pluginId: string;
      isActivated: boolean;
      isInstalled: boolean;
    };
  };
}

// Shared list of required manifest fields
const REQUIRED_MANIFEST_FIELDS: Array<keyof IAdminPluginManifest> = [
  'name',
  'version',
  'description',
  'author',
  'main',
  'pluginId',
];

export interface IAdminPluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  main: string;
  pluginId: string;
  extensionPoints?: {
    routes?: Array<{
      pluginId: string;
      path: string;
      component: string;
      exact: boolean;
    }>;
  };
}

export interface IAdminPluginZipStructure {
  hasAdminFolder: boolean;
  hasApiFolder: boolean;
  adminManifest?: IAdminPluginManifest;
  apiManifest?: IAdminPluginManifest;
  pluginId?: string;
  files: Record<string, string>;
  apiFiles?: string[];
}

export interface IAdminPluginInstallationResult {
  success: boolean;
  pluginId: string;
  manifest?: IAdminPluginManifest;
  installedComponents: string[];
  error?: string;
}

export interface IAdminApolloClient {
  mutate(options: {
    mutation: unknown;
    variables?: Record<string, unknown>;
  }): Promise<{ data?: unknown }>;
}

export interface IAdminPluginInstallationOptions {
  zipFile: File;
  apolloClient?: IAdminApolloClient;
}

export async function validateAdminPluginZip(
  zipFile: File,
): Promise<IAdminPluginZipStructure> {
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(zipFile);

  const structure: IAdminPluginZipStructure = {
    hasAdminFolder: false,
    hasApiFolder: false,
    files: {},
  };

  // ADMIN FOLDER
  const adminFiles = Object.keys(zipContent.files).filter(
    (f) => f.startsWith('admin/') && !f.endsWith('/'),
  );

  if (adminFiles.length > 0) {
    structure.hasAdminFolder = true;

    for (const fileName of adminFiles) {
      const file = zipContent.file(fileName);
      if (file) {
        const rel = fileName.substring(6);
        const isBinary =
          /\.(png|jpg|jpeg|gif|svg|ico|webp|pdf|zip|tar|gz)$/i.test(fileName);

        structure.files[rel] = isBinary
          ? `data:application/octet-stream;base64,${await file.async('base64')}`
          : await file.async('string');
      }
    }

    // MANIFEST
    const manifestFile = zipContent.file('admin/manifest.json');
    if (!manifestFile) {
      throw new Error('admin/manifest.json not found in the plugin ZIP');
    }

    try {
      const manifestJson = await manifestFile.async('string');
      const manifest = JSON.parse(manifestJson) as IAdminPluginManifest;

      const missing = REQUIRED_MANIFEST_FIELDS.filter((k) => !manifest[k]);

      if (missing.length > 0) {
        throw new Error(
          `Missing required fields in admin manifest.json: ${missing.join(
            ', ',
          )}`,
        );
      }

      structure.adminManifest = manifest;
      structure.pluginId = manifest.pluginId;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Invalid admin manifest.json: ${msg}`);
    }
  }

  // API FOLDER
  const apiFiles = Object.keys(zipContent.files).filter(
    (f) => f.startsWith('api/') && !f.endsWith('/'),
  );

  if (apiFiles.length > 0) {
    structure.hasApiFolder = true;
    structure.apiFiles = apiFiles.map((f) => f.substring(4));

    const apiManifestFile = zipContent.file('api/manifest.json');
    if (!apiManifestFile) {
      throw new Error('api/manifest.json not found in the plugin ZIP');
    }

    try {
      const manifestJson = await apiManifestFile.async('string');
      const apiManifest = JSON.parse(manifestJson) as IAdminPluginManifest;

      const missing = REQUIRED_MANIFEST_FIELDS.filter((k) => !apiManifest[k]);

      if (missing.length > 0) {
        throw new Error(
          `Missing required fields in api manifest.json: ${missing.join(', ')}`,
        );
      }

      structure.apiManifest = apiManifest;

      // Ensure IDs match
      if (structure.pluginId && structure.pluginId !== apiManifest.pluginId) {
        throw new Error('Admin and API manifests must have the same pluginId');
      }

      if (!structure.pluginId) {
        structure.pluginId = apiManifest.pluginId;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Invalid api manifest.json: ${msg}`);
    }
  }

  return structure;
}

export function validateAdminPluginStructure(files: Record<string, string>) {
  if (!files['manifest.json']) {
    return { valid: false, error: 'manifest.json is required' };
  }

  try {
    const manifest = JSON.parse(files['manifest.json']);

    for (const f of REQUIRED_MANIFEST_FIELDS) {
      if (!manifest[f]) {
        return { valid: false, error: `Missing required field: ${f}` };
      }
    }

    if (!files[manifest.main]) {
      return { valid: false, error: `Main file not found: ${manifest.main}` };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid manifest.json format' };
  }
}

export async function installAdminPluginFromZip(
  options: IAdminPluginInstallationOptions,
): Promise<IAdminPluginInstallationResult> {
  const { zipFile, apolloClient } = options;

  try {
    const structure = await validateAdminPluginZip(zipFile);

    if (!structure.pluginId) {
      throw new Error('pluginId missing in plugin ZIP');
    }

    const pluginId = structure.pluginId;

    // Choose manifest defensively; if none, fail early.
    const manifest = structure.adminManifest ?? structure.apiManifest;

    const installedComponents: string[] = [];

    // STEP 1: Create plugin in DB
    if (apolloClient) {
      try {
        await apolloClient.mutate({
          mutation: CREATE_PLUGIN_MUTATION,
          variables: { input: { pluginId } },
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : '';
        if (!msg.includes('already exists')) {
          throw new Error(
            `Failed to create plugin in database: ${msg || 'Unknown error'}`,
          );
        }
      }
    }

    // STEP 2: Install API part
    if (structure.hasApiFolder && apolloClient) {
      try {
        const resp = (await apolloClient.mutate({
          mutation: UPLOAD_PLUGIN_ZIP_MUTATION,
          variables: { input: { pluginZip: zipFile, activate: false } },
        })) as IUploadPluginZipResponse;

        if (resp.data?.uploadPluginZip) {
          installedComponents.push('API');
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : '';
        throw new Error(`Failed to install API component: ${msg}`);
      }
    }

    // STEP 3: Install Admin part
    if (structure.hasAdminFolder) {
      const validation = validateAdminPluginStructure(structure.files);

      if (!validation.valid) {
        throw new Error(`Invalid admin structure: ${validation.error}`);
      }

      const result = await adminPluginFileService.installPlugin(
        pluginId,
        structure.files,
      );

      if (!result.success) {
        throw new Error(`Failed to install admin plugin: ${result.error}`);
      }

      installedComponents.push('Admin');
    }

    return {
      success: true,
      pluginId,
      manifest,
      installedComponents,
    };
  } catch (err) {
    return {
      success: false,
      pluginId: '',
      manifest: undefined,
      installedComponents: [],
      error: err instanceof Error ? err.message : 'Failed to upload plugin',
    };
  }
}

export async function getInstalledAdminPlugins() {
  try {
    const plugins = await adminPluginFileService.getInstalledPlugins();

    return plugins.map((p) => ({
      pluginId: p.pluginId,
      manifest: p.manifest,
      installedAt: p.installedAt,
    }));
  } catch (error) {
    console.error('Failed to get installed plugins:', error);
    return [];
  }
}

export async function removeAdminPlugin(pluginId: string) {
  try {
    return await adminPluginFileService.removePlugin(pluginId);
  } catch (error) {
    console.error(`Failed to remove plugin ${pluginId}:`, error);
    return false;
  }
}

// Backward compatibility for old imports
/** @deprecated Use IAdminPluginManifest instead */
export type AdminPluginManifest = IAdminPluginManifest;
/** @deprecated Use IAdminPluginZipStructure instead */
export type AdminPluginZipStructure = IAdminPluginZipStructure;
/** @deprecated Use IAdminPluginInstallationResult instead */
export type AdminPluginInstallationResult = IAdminPluginInstallationResult;
/** @deprecated Use IAdminPluginInstallationOptions instead */
export type AdminPluginInstallationOptions = IAdminPluginInstallationOptions;
```

- App.tsx (full file)
```
import React, { lazy, Suspense, useEffect, useMemo } from 'react';
import { Route, Routes } from 'react-router';
import { useQuery, useApolloClient } from '@apollo/client';
import useLocalStorage from 'utils/useLocalstorage';
import SecuredRoute from 'components/SecuredRoute/SecuredRoute';
import SecuredRouteForUser from 'components/UserPortal/SecuredRouteForUser/SecuredRouteForUser';
import OrganizaitionFundCampiagn from 'screens/OrganizationFundCampaign/OrganizationFundCampagins';
import { CURRENT_USER } from 'GraphQl/Queries/Queries';
import LoginPage from 'screens/LoginPage/LoginPage';
import {
  usePluginRoutes,
  PluginRouteRenderer,
  discoverAndRegisterAllPlugins,
} from 'plugin';
import { getPluginManager } from 'plugin/manager';
import UserScreen from 'screens/UserPortal/UserScreen/UserScreen';
import UserGlobalScreen from 'screens/UserPortal/UserGlobalScreen/UserGlobalScreen';
import Loader from 'components/Loader/Loader';

const OrganizationScreen = lazy(
  () => import('components/OrganizationScreen/OrganizationScreen'),
);
const SuperAdminScreen = lazy(
  () => import('components/SuperAdminScreen/SuperAdminScreen'),
);
const BlockUser = lazy(() => import('screens/BlockUser/BlockUser'));
const EventManagement = lazy(
  () => import('screens/EventManagement/EventManagement'),
);
const ForgotPassword = lazy(
  () => import('screens/ForgotPassword/ForgotPassword'),
);
const MemberDetail = lazy(() => import('screens/MemberDetail/MemberDetail'));
const OrgContribution = lazy(
  () => import('screens/OrgContribution/OrgContribution'),
);
const OrgList = lazy(() => import('screens/OrgList/OrgList'));
const OrgPost = lazy(() => import('screens/OrgPost/OrgPost'));
const OrgSettings = lazy(() => import('screens/OrgSettings/OrgSettings'));

const OrganizationDashboard = lazy(
  () => import('screens/OrganizationDashboard/OrganizationDashboard'),
);
const OrganizationEvents = lazy(
  () => import('screens/OrganizationEvents/OrganizationEvents'),
);
const OrganizationFunds = lazy(
  () => import('screens/OrganizationFunds/OrganizationFunds'),
);
const OrganizationTransactions = lazy(
  () => import('screens/OrganizationTransactions/OrganizationTransactions'),
);
const FundCampaignPledge = lazy(
  () => import('screens/FundCampaignPledge/FundCampaignPledge'),
);
const OrganizationPeople = lazy(
  () => import('screens/OrganizationPeople/OrganizationPeople'),
);
const OrganizationTags = lazy(
  () => import('screens/OrganizationTags/OrganizationTags'),
);
const ManageTag = lazy(() => import('screens/ManageTag/ManageTag'));
const SubTags = lazy(() => import('screens/SubTags/SubTags'));
const Requests = lazy(() => import('screens/Requests/Requests'));
const Users = lazy(() => import('screens/Users/Users'));
const CommunityProfile = lazy(
  () => import('screens/CommunityProfile/CommunityProfile'),
);
const OrganizationVenues = lazy(
  () => import('screens/OrganizationVenues/OrganizationVenues'),
);
const Leaderboard = lazy(() => import('screens/Leaderboard/Leaderboard'));
const Advertisements = lazy(
  () => import('components/Advertisements/Advertisements'),
);
const Donate = lazy(() => import('screens/UserPortal/Donate/Donate'));
const Transactions = lazy(
  () => import('screens/UserPortal/Transactions/Transactions'),
);
const Events = lazy(() => import('screens/UserPortal/Events/Events'));
const Posts = lazy(() => import('screens/UserPortal/Posts/Posts'));
const Organizations = lazy(
  () => import('screens/UserPortal/Organizations/Organizations'),
);
const People = lazy(() => import('screens/UserPortal/People/People'));
const Settings = lazy(() => import('screens/UserPortal/Settings/Settings'));
const Chat = lazy(() => import('screens/UserPortal/Chat/Chat'));
const EventDashboardScreen = lazy(
  () => import('components/EventDashboardScreen/EventDashboardScreen'),
);
const AcceptInvitation = lazy(
  () => import('screens/Public/Invitation/AcceptInvitation'),
);
const Campaigns = lazy(() => import('screens/UserPortal/Campaigns/Campaigns'));
const Pledges = lazy(() => import('screens/UserPortal/Pledges/Pledges'));
const VolunteerManagement = lazy(
  () => import('screens/UserPortal/Volunteer/VolunteerManagement'),
);
const LeaveOrganization = lazy(
  () => import('screens/UserPortal/LeaveOrganization/LeaveOrganization'),
);
const Notification = lazy(() => import('screens/Notification/Notification'));

const PluginStore = lazy(() => import('screens/PluginStore/PluginStore'));

const { setItem } = useLocalStorage();

const LazyPageNotFound = lazy(
  () => import('screens/PageNotFound/PageNotFound'),
);

/**
 * This is the main function for our application. It sets up all the routes and components,
 * defining how the user can navigate through the app. The function uses React Router's `Routes`
 * and `Route` components to map different URL paths to corresponding screens and components.
 *
 * ## Important Details
 * - **UseEffect Hook**: This hook checks user authentication status using the `CHECK_AUTH` GraphQL query.
 * - **Routes**:
 *   - The root route ("/") takes the user to the `LoginPage`.
 *   - Protected routes are wrapped with the `SecuredRoute` component to ensure they are only accessible to authenticated users.
 *   - Admin and Super Admin routes allow access to organization and user management screens.
 *   - User portal routes allow end-users to interact with organizations, settings, chat, events, etc.
 *   - Plugin routes are dynamically added based on loaded plugins and user permissions.
 *
 * @returns  The rendered routes and components of the application.
 */

function App(): React.ReactElement {
  const { data, loading } = useQuery(CURRENT_USER);
  const apolloClient = useApolloClient();

  // Get user permissions and admin status (memoized to prevent infinite loops)
  const userPermissions = useMemo(() => {
    return (
      data?.currentUser?.appUserProfile?.adminFor?.map(
        (org: { _id: string }) => org._id,
      ) || []
    );
  }, [data?.currentUser?.appUserProfile?.adminFor]);

  const isAdmin =
    data?.currentUser?.userType === 'ADMIN' ||
    data?.currentUser?.userType === 'SUPERADMIN';
  const isSuperAdmin = data?.currentUser?.userType === 'SUPERADMIN';

  // Get plugin routes
  const adminGlobalPluginRoutes = usePluginRoutes(userPermissions, true, false);
  const adminOrgPluginRoutes = usePluginRoutes(userPermissions, true, true);
  const userOrgPluginRoutes = usePluginRoutes(userPermissions, false, true);
  const userGlobalPluginRoutes = usePluginRoutes(userPermissions, false, false);

  console.log('=== APP.TSX ROUTE DEBUG ===');
  console.log('Current user data:', {
    userType: data?.currentUser?.userType,
    isAdmin,
    isSuperAdmin,
    userPermissions: userPermissions.length,
    userPermissionsArray: userPermissions,
  });
  console.log('Plugin routes loaded:', {
    admin: {
      count: adminOrgPluginRoutes.length,
      routes: adminOrgPluginRoutes.map((r) => ({
        path: r.path,
        component: r.component,
        pluginId: r.pluginId,
      })),
    },
    user: {
      count: userOrgPluginRoutes.length,
      routes: userOrgPluginRoutes.map((r) => ({
        path: r.path,
        component: r.component,
        pluginId: r.pluginId,
      })),
    },
  });
  console.log('=== END APP.TSX ROUTE DEBUG ===');

  // Initialize plugin system on app startup
  useEffect(() => {
    const initializePlugins = async () => {
      try {
        // Set Apollo client for plugin manager
        getPluginManager().setApolloClient(apolloClient);

        // Initialize plugin manager
        await getPluginManager().initializePluginSystem();

        await discoverAndRegisterAllPlugins();

        console.log('Plugin system initialized successfully');
      } catch (error) {
        console.error('Failed to initialize plugin system:', error);
      }
    };

    initializePlugins();
  }, [apolloClient]);

  useEffect(() => {
    if (!loading && data?.currentUser) {
      const auth = data.currentUser;
      setItem('IsLoggedIn', 'TRUE');
      setItem('id', auth.id);
      setItem('name', auth.name);
      setItem('email', auth.emailAddress);
      // setItem('UserImage', auth.avatarURL|| "");
    }
  }, [data, loading, setItem]);

  return (
    <>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<LoginPage />} />
          <Route path="/admin" element={<LoginPage />} />
          <Route element={<SecuredRoute />}>
            <Route element={<SuperAdminScreen />}>
              <Route path="/orglist" element={<OrgList />} />
              <Route path="/notification" element={<Notification />} />
              <Route path="/member" element={<MemberDetail />} />
              <Route path="/users" element={<Users />} />
              <Route path="/communityProfile" element={<CommunityProfile />} />
              <Route path="/pluginstore" element={<PluginStore />} />
              {/* Admin global plugin routes (e.g., settings) */}
              {adminGlobalPluginRoutes.map((route) => (
                <Route
                  key={`${route.pluginId}-${route.path}`}
                  path={route.path}
                  element={
                    <PluginRouteRenderer
                      route={route}
                      fallback={<div>Loading admin plugin...</div>}
                    />
                  }
                />
              ))}
            </Route>
            <Route element={<OrganizationScreen />}>
              <Route path="/requests/:orgId" element={<Requests />} />
              <Route
                path="/orgdash/:orgId"
                element={<OrganizationDashboard />}
              />
              <Route
                path="/orgpeople/:orgId"
                element={<OrganizationPeople />}
              />
              <Route path="/orgtags/:orgId" element={<OrganizationTags />} />
              <Route
                path="orgtags/:orgId/manageTag/:tagId"
                element={<ManageTag />}
              />
              <Route
                path="orgtags/:orgId/subTags/:tagId"
                element={<SubTags />}
              />
              <Route path="/member/:orgId" element={<MemberDetail />} />
              <Route
                path="/orgevents/:orgId"
                element={<OrganizationEvents />}
              />
              <Route
                path="/event/:orgId/:eventId"
                element={<EventManagement />}
              />

              <Route path="/orgfunds/:orgId" element={<OrganizationFunds />} />
              <Route
                path="/orgtransactions/:orgId"
                element={<OrganizationTransactions />}
              />
              <Route
                path="/orgfundcampaign/:orgId/:fundId"
                element={<OrganizaitionFundCampiagn />}
              />
              <Route
                path="/fundCampaignPledge/:orgId/:fundCampaignId"
                element={<FundCampaignPledge />}
              />
              <Route path="/orgcontribution" element={<OrgContribution />} />
              <Route path="/orgpost/:orgId" element={<OrgPost />} />
              <Route path="/orgsetting/:orgId" element={<OrgSettings />} />
              <Route path="/orgads/:orgId" element={<Advertisements />} />
              <Route path="/blockuser/:orgId" element={<BlockUser />} />
              <Route
                path="/orgvenues/:orgId"
                element={<OrganizationVenues />}
              />
              <Route path="/leaderboard/:orgId" element={<Leaderboard />} />
              <Route path="/orgchat/:orgId" element={<Chat />} />
              {/* Admin org plugin routes */}
              {adminOrgPluginRoutes.map((route) => (
                <Route
                  key={`${route.pluginId}-${route.path}`}
                  path={route.path}
                  element={
                    <PluginRouteRenderer
                      route={route}
                      fallback={<div>Loading admin plugin...</div>}
                    />
                  }
                />
              ))}
            </Route>
          </Route>
          <Route path="/forgotPassword" element={<ForgotPassword />} />
          {/* Public invitation accept route */}
          <Route
            path="/event/invitation/:token"
            element={<AcceptInvitation />}
          />
          {/* User Portal Routes */}
          <Route element={<SecuredRouteForUser />}>
            <Route path="/user/organizations" element={<Organizations />} />
            <Route path="/user/settings" element={<Settings />} />
            {/* User global plugin routes (no orgId required) */}
            <Route element={<UserGlobalScreen />}>
              {userGlobalPluginRoutes.map((route) => (
                <Route
                  key={`${route.pluginId}-${route.path}`}
                  path={route.path}
                  element={
                    <PluginRouteRenderer
                      route={route}
                      fallback={<div>Loading user plugin...</div>}
                    />
                  }
                />
              ))}
            </Route>
            <Route element={<UserScreen />}>
              <Route path="/user/chat/:orgId" element={<Chat />} />
              <Route path="/user/organizations" element={<Organizations />} />
              <Route path="/user/organization/:orgId" element={<Posts />} />
              <Route path="/user/people/:orgId" element={<People />} />
              <Route path="/user/donate/:orgId" element={<Donate />} />
              <Route
                path="/user/transactions/:orgId"
                element={<Transactions />}
              />
              <Route path="/user/events/:orgId" element={<Events />} />
              <Route path="/user/campaigns/:orgId" element={<Campaigns />} />
              <Route path="/user/pledges/:orgId" element={<Pledges />} />
              <Route
                path="/user/leaveOrg/:orgId"
                element={<LeaveOrganization />}
              />
              <Route path="/user/notification" element={<Notification />} />
              <Route
                path="/user/volunteer/:orgId"
                element={<VolunteerManagement />}
              />
              {/* User org plugin routes */}
              {userOrgPluginRoutes.map((route) => (
                <Route
                  key={`${route.pluginId}-${route.path}`}
                  path={route.path}
                  element={
                    <PluginRouteRenderer
                      route={route}
                      fallback={<div>Loading user plugin...</div>}
                    />
                  }
                />
              ))}
              <Route element={<EventDashboardScreen />}>
                <Route
                  path="/user/event/:orgId/:eventId"
                  element={<EventManagement />}
                />
              </Route>
            </Route>
          </Route>
          {/* <SecuredRouteForUser path="/user/chat" component={Chat} /> */}
          <Route
            path="*"
            element={
              <Suspense fallback={<Loader />}>
                <LazyPageNotFound />
              </Suspense>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
```

#original cypress.config.ts from develop branch(before my edit):
```
import { defineConfig } from 'cypress';
import fs from 'node:fs';
import codeCoverageTask from '@cypress/code-coverage/task';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || '4321';

export default defineConfig({
  e2e: {
    baseUrl: `http://localhost:${PORT}`,

    // Viewport settings
    viewportWidth: 1920,
    viewportHeight: 1080,
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',

    defaultCommandTimeout: 50000,
    requestTimeout: 50000,
    responseTimeout: 50000,
    pageLoadTimeout: 50000,

    testIsolation: false, // Keep state between tests in same spec
    experimentalRunAllSpecs: true,

    watchForFileChanges: true,
    chromeWebSecurity: false,
    retries: {
      runMode: 3,
      openMode: 0,
    },

    // Environment variables
    env: {
      apiUrl: process.env.CYPRESS_API_URL || 'http://localhost:4000/graphql',
    },
    setupNodeEvents(on, config) {
      codeCoverageTask(on, config);
      // Custom task to log messages and read files
      on('task', {
        log(message: string) {
          console.log(message);
          return null;
        },
        readFileMaybe(filename: string) {
          return fs.existsSync(filename)
            ? fs.readFileSync(filename, 'utf8')
            : null;
        },
      });

      // Browser launch options for both Chrome and Firefox
      on('before:browser:launch', (browser, launchOptions) => {
        // Chrome specific configurations
        if (browser.name === 'chrome') {
          if (browser.isHeadless) {
            launchOptions.args.push('--max_old_space_size=4096');
          }

          // Chrome performance optimizations
          launchOptions.args.push('--disable-dev-shm-usage');
          launchOptions.args.push('--no-sandbox');
        }

        // Firefox specific configurations
        if (browser.name === 'firefox') {
          // Firefox preferences
          launchOptions.preferences = {
            ...launchOptions.preferences,
            'signon.rememberSignons': false,
            'browser.safebrowsing.enabled': false,
            'browser.safebrowsing.malware.enabled': false,
            'app.update.enabled': false,
            'browser.download.folderList': 2,
            'browser.download.manager.showWhenStarting': false,
            'browser.helperApps.neverAsk.saveToDisk':
              'application/pdf,text/csv,application/csv',
          };
          launchOptions.args = launchOptions.args || [];
        }

        return launchOptions;
      });

      // Custom plugins can be registered here
      // Example: require('@cypress/code-coverage/task')(on, config);

      return config;
    },
  },

  includeShadowDom: true,
  experimentalStudio: true,

  downloadsFolder: 'cypress/downloads',
  fixturesFolder: 'cypress/fixtures',
});
```