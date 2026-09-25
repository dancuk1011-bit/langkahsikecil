import {defineConfig} from 'vitest/config';
import path from 'node:path';
export default defineConfig({resolve:{alias:{'@':path.resolve(process.cwd()),'virtual:pwa-register/react':path.resolve(process.cwd(),'tests/sw-mock.ts')}},test:{environment:'node',include:['tests/**/*.test.ts','tests/**/*.test.tsx']}});
