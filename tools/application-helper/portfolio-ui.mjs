import {PORTFOLIO_URL} from './portfolio-answers.mjs';
export function addPortfolioEvidence(container,suggestion){
 if(!suggestion.portfolioDerived||!suggestion.sources?.length)return;
 const details=document.createElement('details'),summary=document.createElement('summary');details.className='portfolio-evidence';summary.textContent='Why this answer · portfolio sources';details.append(summary);
 for(const source of suggestion.sources){
  if(!source.url.startsWith(PORTFOLIO_URL))continue;
  const a=document.createElement('a');a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=source.title+' ↗';
  const quote=document.createElement('small');quote.textContent=source.quote;
  const item=document.createElement('div');item.append(a,quote);details.append(item);
 }
 container.append(details);
}
