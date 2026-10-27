import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const dependencies=fileURLToPath(new URL('../../tmp/cad-tools/node_modules/',import.meta.url));
const require=createRequire(import.meta.url);
const {build}=require(require.resolve('esbuild',{paths:[root,dependencies]}));
await build({absWorkingDir:root,entryPoints:['src/scripts/wind-tunnel.js'],
  outfile:'src/scripts/wind-tunnel.bundle.js',bundle:true,format:'esm',minify:true,
  legalComments:'eof',nodePaths:[dependencies]});
