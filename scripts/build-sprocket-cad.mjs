import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
await build({absWorkingDir:root,entryPoints:['src/scripts/sprocket-cad.js'],outfile:'src/scripts/sprocket-cad.bundle.js',bundle:true,format:'esm',minify:true,legalComments:'eof'});
