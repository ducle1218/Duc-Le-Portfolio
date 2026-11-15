// Presentation preferences, not a credibility score or a hiring recommendation.
// Logos are small local copies of the employers' own published assets.
const brands=[
 ['lockheed','Lockheed Martin','lockheed.png','Defense',/^lockheed martin(?: corporation)?$/],
 ['raytheon','Raytheon','rtx.svg','Defense',/^raytheon(?: technologies| company| missiles ?&? ?defense)?$/],
 ['rtx','RTX','rtx.svg','Defense',/^(?:rtx(?: corporation)?|collins aerospace|pratt ?& ?whitney)$/],
 ['northrop','Northrop Grumman','northrop.ico','Defense',/^northrop grumman(?: corporation)?$/],
 ['boeing','Boeing','boeing.ico','Aerospace',/^(?:the )?boeing(?: company)?$/],
 ['google','Google','google.ico','Technology',/^(?:google(?: llc)?|alphabet(?: inc)?)$/],
 ['amazon','Amazon','amazon.ico','Technology',/^(?:amazon(?:\.com)?(?: services| web services)?(?: inc| llc)?|aws)$/],
 ['microsoft','Microsoft','microsoft.png','Technology',/^microsoft(?: corporation)?$/],
 ['nvidia','NVIDIA','nvidia.svg','Technology',/^nvidia(?: corporation)?$/],
 ['intel','Intel',null,'Technology',/^intel(?: corporation)?$/],
 ['apple','Apple',null,'Technology',/^apple(?: inc)?$/],
 ['meta','Meta',null,'Technology',/^meta(?: platforms)?(?: inc)?$/],
 ['amd','AMD',null,'Technology',/^(?:amd|advanced micro devices)(?: inc)?$/],
 ['spacex','SpaceX','spacex.ico','Aerospace',/^(?:spacex|space exploration technologies(?: corp)?)$/],
 ['blueorigin','Blue Origin',null,'Aerospace',/^blue origin(?: llc)?$/],
];
export function companyBrand(company){
 const name=String(company||'').toLowerCase().replace(/[,®™]/g,'').replace(/\.$/,'').replace(/\s+/g,' ').trim();
 const match=brands.find(b=>b[4].test(name));
 if(!match)return {featured:false,initials:String(company||'?').trim().split(/\s+/).slice(0,2).map(s=>s[0]).join('').toUpperCase()};
 const [id,label,logo,sector]=match;
 return {id,label,logo:logo?new URL('./logos/'+logo,import.meta.url).href:null,sector,featured:true,initials:label.split(' ').map(s=>s[0]).slice(0,2).join('')};
}
