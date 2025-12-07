import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgrPlugin from 'vite-plugin-svgr';
import EnvironmentPlugin from 'vite-plugin-environment';
import createInternalFileWriterPlugin from '../src/plugin/vite/internalFileWriterPlugin';
import istanbul from 'vite-plugin-istanbul';

// Only expose explicitly safe, public client env vars
const CLIENT_ENV_ALLOWLIST = [
  'REACT_APP_TALAWA_URL',
  'REACT_APP_BACKEND_WEBSOCKET_URL',
  'REACT_APP_USE_RECAPTCHA',
  'REACT_APP_RECAPTCHA_SITE_KEY',
];

// Warn (or fail when STRICT_ENV=1) if potentially sensitive env vars are present but not explicitly allowlisted for client exposure.
function validateClientEnv(): void {
  const strict = process.env.STRICT_ENV === '1';
  const suspectPatterns = [
    /SECRET/i,
    /TOKEN/i,
    /PASSWORD/i,
    /PRIVATE/i,
    /API_KEY/i,
    /KEY$/i,
  ];

  const offenders = Object.keys(process.env || {}).filter((key) => {
    if (CLIENT_ENV_ALLOWLIST.includes(key)) return false;
    return suspectPatterns.some((re) => re.test(key)) && process.env[key];
  });

  if (offenders.length) {
    const msg = `Detected non-allowlisted env vars with sensitive-looking names: ${offenders.join(
      ', ',
    )}. Only allowlisted REACT_APP_* vars should be client-exposed.`;
    if (strict) {
      throw new Error(msg);
    } else {
      console.warn(msg);
    }
  }
}

validateClientEnv();

const parsed = parseInt(process.env.PORT || '', 10);
const PORT =
  !isNaN(parsed) && parsed >= 1024 && parsed <= 65535 ? parsed : 4321;

// Provide safe defaults to avoid build-time errors when envs are absent locally.
const CLIENT_ENV_DEFAULTS = CLIENT_ENV_ALLOWLIST.reduce(
  (acc, key) => ({ ...acc, [key]: process.env[key] ?? '' }),
  {} as Record<string, string>,
);

export default defineConfig({
  // depending on your application, base can also be "/"
  build: {
    outDir: 'build',
  },
  base: '',
  plugins: [
    react(),
    viteTsconfigPaths(),
    EnvironmentPlugin(CLIENT_ENV_DEFAULTS),
    svgrPlugin({
      svgrOptions: {
        icon: true,
        // ...svgr options (https://react-svgr.com/docs/options/)
      },
    }),
    createInternalFileWriterPlugin({
      enabled: true,
      debug: process.env.NODE_ENV === 'development',
      basePath: 'src/plugin/available',
    }),
    istanbul({
      extension: ['.js', '.ts', '.jsx', '.tsx'],
      requireEnv: true,
      cypress: true,
      include: [
        'src/screens/**/*.{js,jsx,ts,tsx}',
        'src/components/**/*.{js,jsx,ts,tsx}',
        'src/subComponents/**/*.{js,jsx,ts,tsx}',
      ],
      exclude: [
        'node_modules/**',
        'cypress/**',
        'coverage/**',
        '.nyc_output/**',
        'src/**/*.spec.{ts,tsx,js,jsx}',
        'src/**/__tests__/**',
      ],
    }),
  ],
  server: {
    // Allow all hosts for flexibility as Talawa runs on multiple domains
    allowedHosts: true,
    watch: {
      ignored: ['**/coverage/**', '**/.nyc_output/**'],
    },
    // this ensures that the browser opens upon server start
    open: false,
    host: '0.0.0.0',
    // Uses PORT environment variable, defaults to 4321
    port: PORT,
  },
});
