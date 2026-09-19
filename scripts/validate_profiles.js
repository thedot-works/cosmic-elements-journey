// Validates js/data/element-profiles*.js: every element present, shells sum to Z,
// every reaction step conserves charge and nucleon number, recipes map to sites,
// and every element appears exactly once in the free-play order of its own site.
const fs = require('fs'); const vm = require('vm'); const path = require('path');
const root = path.join(__dirname, '..');
const ctx = { window:{}, console };
vm.createContext(ctx);
for (const f of ['js/elements-data.js','js/data/element-profiles.js','js/data/element-profiles-2.js']) {
  vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'), ctx, {filename:f});
}
const EP = ctx.window.ElementProfiles;
let errors = 0; const err = (...a)=>{ errors++; console.log('ERROR', ...a); };
const seen = {};
for (let z=1; z<=118; z++) {
  let p;
  try { p = EP.get(z); } catch(e){ err(z, 'get() threw', e.message); continue; }
  if(!p){ err(z,'missing profile'); continue; }
  const s = p.shells.reduce((a,b)=>a+b,0);
  if (s!==z) err(z,p.sym,'shell sum',s);
  if (!EP.SITES[p.recipe]) err(z,p.sym,'bad recipe',p.recipe);
  if (!p.look || !p.look.form) err(z,p.sym,'no look');
  if (!p.today || !p.found) err(z,p.sym,'missing today/found');
  const mixKeys = Object.keys(p.mix||{});
  if (!mixKeys.length) err(z,p.sym,'no mix');
  mixKeys.forEach(k=>{ if(!EP.ORIGINS[k]) err(z,p.sym,'bad origin key',k); });
  if (!p.steps.length) err(z,p.sym,'no reaction steps');
  p.steps.forEach((st,i)=>{
    if (st.outs.some(o=>o.kind==='frag') || st.ins.some(o=>o.kind==='quarks')) return;
    const charge = t => ({nucleus:t.Z, p:1, n:0, 'e-':-1, 'e+':1, nu:0, nubar:0, gamma:0, atom:0}[t.kind]) * t.count;
    const baryon = t => ({nucleus:t.A, p:1, n:1, atom:1}[t.kind]||0) * t.count;
    const qi = st.ins.reduce((a,t)=>a+charge(t),0), qo = st.outs.reduce((a,t)=>a+charge(t),0);
    const bi = st.ins.reduce((a,t)=>a+baryon(t),0), bo = st.outs.reduce((a,t)=>a+baryon(t),0);
    if (qi!==qo) err(z,p.sym,'step',i,'charge',qi,'->',qo, st.raw);
    if (bi!==bo) err(z,p.sym,'step',i,'nucleons',bi,'->',bo, st.raw);
  });
  const last = p.steps[p.steps.length-1];
  const prod = last.product;
  if (prod && prod.kind==='nucleus' && prod.Z!==z && !(p.chain) ) err(z,p.sym,'final product is not this element', last.raw);
  if (p.chain && prod && prod.Z!==z) err(z,p.sym,'chain final product mismatch', last.raw);
  if (p.iso.A - z < 0) err(z,p.sym,'negative N');
  const list = EP.FREEPLAY_ORDER[p.recipe]||[];
  if (!list.includes(z)) err(z,p.sym,'not in freeplay order of', p.recipe);
}
Object.entries(EP.FREEPLAY_ORDER).forEach(([site,list])=>{
  const dup = list.filter((z,i)=>list.indexOf(z)!==i);
  if (dup.length) err('site',site,'duplicates',dup);
  list.forEach(z=>{ const p=EP.get(z); if(p && p.recipe!==site && !(site==='sunlike'&&z===2) && !(site==='bigbang')) err('site',site,'lists',z,'whose recipe is',p.recipe); });
});
const counts = {}; for(let z=1;z<=118;z++){ const p=EP.get(z); counts[p.recipe]=(counts[p.recipe]||0)+1; }
console.log('recipes:', counts);
console.log('forms:', [...new Set(Array.from({length:118},(_,i)=>EP.get(i+1).look.form))].join(', '));
console.log(errors ? `${errors} error(s)` : 'ALL PROFILES VALID');
process.exit(errors?1:0);
