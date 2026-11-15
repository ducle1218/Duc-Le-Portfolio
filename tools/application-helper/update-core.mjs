const decode=new TextDecoder();
export function compareVersions(a,b){const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<Math.max(x.length,y.length);i++){const n=(x[i]||0)-(y[i]||0);if(n)return Math.sign(n);}return 0;}
export function readUpdateZip(bytes){
 if(bytes.length>5_000_000||bytes.length<22)throw new Error('Choose the Application Helper ZIP (under 5 MB).');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),end=bytes.length-22;
 if(view.getUint32(end,true)!==0x06054b50||view.getUint16(end+4,true)||view.getUint16(end+6,true)||view.getUint16(end+20,true))throw new Error('Unsupported update ZIP. Download the original ZIP from Studio.');
 const count=view.getUint16(end+10,true);let cursor=view.getUint32(end+16,true);const centralStart=cursor,files=new Map();
 if(count<5||count>50||cursor+view.getUint32(end+12,true)!==end)throw new Error('Invalid update archive.');
 for(let i=0;i<count;i++){
  if(cursor+46>end||view.getUint32(cursor,true)!==0x02014b50||view.getUint16(cursor+8,true)!==0||view.getUint16(cursor+10,true)!==0)throw new Error('Unsupported ZIP entry.');
  const size=view.getUint32(cursor+24,true),length=view.getUint16(cursor+28,true),extra=view.getUint16(cursor+30,true),comment=view.getUint16(cursor+32,true),offset=view.getUint32(cursor+42,true);
  if(cursor+46+length+extra+comment>end||offset+30>centralStart||size>1_000_000||size!==view.getUint32(cursor+20,true))throw new Error('Invalid ZIP entry size.');
  const name=decode.decode(bytes.slice(cursor+46,cursor+46+length));
  if(!/^[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)*\.(mjs|js|html|css|json|md)$/.test(name)||files.has(name))throw new Error('Unsafe or duplicate update filename.');
  if(view.getUint32(offset,true)!==0x04034b50||view.getUint16(offset+6,true)||view.getUint16(offset+8,true))throw new Error('Invalid ZIP entry header.');
  const n=view.getUint16(offset+26,true),start=offset+30+n+view.getUint16(offset+28,true);
  if(start+size>centralStart||decode.decode(bytes.slice(offset+30,offset+30+n))!==name||view.getUint32(offset+22,true)!==size)throw new Error('ZIP headers do not match.');
  files.set(name,bytes.slice(start,start+size));cursor+=46+length+extra+comment;
 }
 if(cursor!==end)throw new Error('Unexpected ZIP directory.');return files;
}
export async function validateUpdate(bytes,release,currentVersion){
 const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
 if(digest!==release.sha256)throw new Error('This ZIP does not match the current published release. Download a fresh copy from Studio.');
 const files=readUpdateZip(bytes),manifest=JSON.parse(decode.decode(files.get('manifest.json')));
 if(manifest.name!=='Duc — Application Helper'||manifest.manifest_version!==3||manifest.version!==release.version||!/^\d+(\.\d+){1,3}$/.test(manifest.version))throw new Error('This is not a valid Application Helper update.');
 if(compareVersions(manifest.version,currentVersion)<0)throw new Error('This ZIP is older than your installed helper.');
 if(!Array.isArray(release.files)||JSON.stringify([...files.keys()].sort())!==JSON.stringify([...release.files].sort()))throw new Error('The update file list does not match the published release.');
 for(const name of ['background.mjs','popup.html','popup.mjs','assistant.bundle.js'])if(!files.has(name))throw new Error('The update is incomplete.');
 return {files,manifest};
}
export async function applyUpdate(directory,files){
 // Only explicitly named, flat package files are replaced. No folder deletion.
 const backups=new Map(),written=[];
 for(const [name] of files){if(!/^[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)*\.(mjs|js|html|css|json|md)$/.test(name))throw new Error('Unsafe update filename.');try{backups.set(name,await (await directory.getFileHandle(name)).getFile());}catch(error){if(error.name!=='NotFoundError')throw error;backups.set(name,null);}}
 const write=async(name,data)=>{const handle=await directory.getFileHandle(name,{create:true}),stream=await handle.createWritable();try{await stream.write(data);await stream.close();}catch(error){await stream.abort().catch(()=>{});throw error;}};
 try{for(const [name,data] of [...files].sort(([a],[b])=>a==='manifest.json'?1:b==='manifest.json'?-1:0)){written.push(name);await write(name,data);}}
 catch(error){let restored=true;for(const name of written.reverse()){try{const old=backups.get(name);if(old)await write(name,old);else await directory.removeEntry(name);}catch{restored=false;}}throw new Error(restored?'Update failed; the previous files were restored. '+error.message:'Update failed and some files could not be restored. Replace the folder files with a fresh ZIP before reloading.');}
}
