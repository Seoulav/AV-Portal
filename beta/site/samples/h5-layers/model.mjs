// User-provided operating example, not a manufacturer-verified resource calculator.
export const CAPACITY = 16;
const placements={one:[80,100],two:[170,120],four:[120,600]};
export function scenario(mode){
 const id=Object.hasOwn(placements,mode)?mode:'two';const [x,width]=placements[id];
 const used=[[40,230],[230,420],[420,610],[610,800]].map(([start,end])=>Number(x<end&&x+width>start));
 const totalConsumed=used.reduce((a,b)=>a+b,0);
 return {id,x,width,cardCount:1,visibleLayers:1,used,totalConsumed,remaining:CAPACITY-totalConsumed};
}
