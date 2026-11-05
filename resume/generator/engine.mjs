const aliases = {assembly:['assemblies','assemble'],fea:['finite element analysis'],cad:['computer-aided design'],collaborative:['collaborate','collaboration'],spreadsheet:['spreadsheets'],mechanisms:['mechanism']};
export function selectWording(manifest, description) {
  const normalized = description.toLowerCase();
  const found = term => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    return new RegExp('(^|[^a-z0-9])'+escaped+'(?=$|[^a-z0-9])','i').test(normalized);
  };
  return manifest.slots.map(slot => {
    let choice = null, best = 0;
    for (const variant of slot.variants) {
      const score = variant.topics.filter(topic => [topic,...(aliases[topic.toLowerCase()]||[])].some(found)).length;
      if (score > best) {best=score;choice=variant;}
    }
    return {...slot, choice, file:choice?.file || slot.id+'-default.pdf'};
  });
}
export async function composePdf(PDFDocument, selected, getBytes) {
  const doc = await PDFDocument.load(await getBytes('base.pdf'));
  const page = doc.getPages()[0];
  const bytes = await Promise.all(selected.map(slot=>getBytes(slot.file)));
  for(let i=0;i<selected.length;i++){
    const source=await PDFDocument.load(bytes[i]);
    const [x0,y0,x1,y1]=selected[i].rect;
    const fragment=await doc.embedPage(source.getPages()[0],{left:x0,bottom:792-y1,right:x1,top:792-y0});
    page.drawPage(fragment,{x:x0,y:792-y1,width:x1-x0,height:y1-y0});
  }
  doc.setTitle('Duc Le — Resume');doc.setAuthor('Duc Le');
  return doc.save();
}
