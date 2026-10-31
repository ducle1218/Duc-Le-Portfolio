import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {buildPortfolioData} from './build-portfolio-data.mjs';
await buildPortfolioData();
const root=fileURLToPath(new URL('../',import.meta.url));
const dependencies=fileURLToPath(new URL('../../tmp/cad-tools/node_modules/',import.meta.url));
const require=createRequire(import.meta.url);
const {transform}=require(require.resolve('esbuild',{paths:[root,dependencies]}));
const paths=JSON.parse(await readFile(new URL('site-scripts.json',import.meta.url),'utf8'));
const sources=await Promise.all(paths.map(file=>readFile(new URL('../'+file,import.meta.url),'utf8')));
const cswa=await readFile(new URL('../src/content/projects/box-3.html',import.meta.url),'utf8');
const portfolioIndex=paths.indexOf('src/scripts/portfolio.js');
sources[portfolioIndex]=sources[portfolioIndex].replace(/const CSWA_COMPLETED_COUNT = \d+;/,
  'const CSWA_COMPLETED_COUNT = '+(cswa.match(/toggleCadViewer\(/g)||[]).length+';');
// Classic script: preserve public function names used by inline controls.
const result=await transform(sources.join('\n;\n'),{loader:'js',minify:true,legalComments:'eof'});
await writeFile(new URL('../src/scripts/site.bundle.js',import.meta.url),result.code);
console.log('Site JavaScript: '+Buffer.byteLength(result.code)+' bytes');
