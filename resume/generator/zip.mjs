// ZIP "store" format: PDFs are already compressed. No dependency or remote upload.
const encoder=new TextEncoder();
const table=Uint32Array.from({length:256},(_,i)=>{for(let j=0;j<8;j++)i=(i>>>1)^((i&1)?0xedb88320:0);return i>>>0;});
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes)crc=(crc>>>8)^table[(crc^byte)&255];return (crc^0xffffffff)>>>0;}
export function makeZip(files){
 const chunks=[],central=[];let offset=0;
 const header=size=>{const bytes=new Uint8Array(size);return [bytes,new DataView(bytes.buffer)];};
 for(const file of files){
  if(!/^[a-zA-Z0-9_.-]+$/.test(file.name))throw new Error('Invalid export filename');
  const name=encoder.encode(file.name),data=typeof file.data==='string'?encoder.encode(file.data):new Uint8Array(file.data),crc=crc32(data);
  const [local,l]=header(30);l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(12,33,true);l.setUint32(14,crc,true);l.setUint32(18,data.length,true);l.setUint32(22,data.length,true);l.setUint16(26,name.length,true);
  chunks.push(local,name,data);
  const [entry,e]=header(46);e.setUint32(0,0x02014b50,true);e.setUint16(4,20,true);e.setUint16(6,20,true);e.setUint16(14,33,true);e.setUint32(16,crc,true);e.setUint32(20,data.length,true);e.setUint32(24,data.length,true);e.setUint16(28,name.length,true);e.setUint32(42,offset,true);central.push(entry,name);
  offset+=30+name.length+data.length;
 }
 const size=central.reduce((n,b)=>n+b.length,0),[end,e]=header(22);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,size,true);e.setUint32(16,offset,true);
 const result=new Uint8Array(offset+size+22);let cursor=0;for(const chunk of [...chunks,...central,end]){result.set(chunk,cursor);cursor+=chunk.length;}return result;
}
