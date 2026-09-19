// ==========================================================================
// FX CORE — the rendering foundation every visualization shares.
//  • HDR scene render → soft-knee bloom (dual-filter mip chain) → ACES tone
//    mapping → sRGB, with vignette, film grain and flash-driven chromatic
//    aberration. Linear colour workflow throughout.
//  • A procedural "studio" environment (PMREM) so metals reflect like metals.
//  • Shared textures, GLSL noise, easing/tween helpers, a camera director,
//    projected DOM labels, and Stage objects that own (and reliably clean up)
//    everything a sequence creates.
// ==========================================================================
(function(){
  const FX = {
    ready:false, renderer:null, scene:null, camera:null,
    time:0, dt:0.016,
    post:{ exposure:1.0, bloomStrength:0.85, bloomRadius:0.9, threshold:0.85, knee:0.55,
           vignette:0.38, grain:0.035, chroma:0.0, flash:0.0, flashColor:new THREE.Color(1,1,1), saturation:1.0 },
    quality:{ pixelRatio:1, msaa:true, levels:5, adaptive:true },
    tex:{}, env:null, frameFns:new Set(), labels:new Set(),
  };

  // ---------------------------------------------------------------- utils
  const clamp = (v,a,b)=> Math.max(a, Math.min(b, v));
  const lerp = (a,b,t)=> a + (b-a)*t;
  const ease = {
    linear:t=>t,
    inOut:t=> t<0.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2,
    out:t=> 1-Math.pow(1-t,3),
    in:t=> t*t*t,
    outBack:t=>{ const c1=1.70158, c3=c1+1; return 1 + c3*Math.pow(t-1,3) + c1*Math.pow(t-1,2); },
    inOutSine:t=> -(Math.cos(Math.PI*t)-1)/2,
    outExpo:t=> t===1 ? 1 : 1-Math.pow(2,-10*t),
    inExpo:t=> t===0 ? 0 : Math.pow(2, 10*t-10),
  };
  FX.clamp = clamp; FX.lerp = lerp; FX.ease = ease;

  // sRGB hex/array → linear THREE.Color
  FX.lin = function(c){
    if(c instanceof THREE.Color) return c.clone();
    if(Array.isArray(c)) return new THREE.Color(c[0],c[1],c[2]); // arrays are already linear
    return new THREE.Color(c).convertSRGBToLinear();
  };
  // Approximate blackbody colour (Tanner Helland fit), returned linear and normalised.
  FX.blackbody = function(K){
    const t = K/100; let r,g,b;
    if(t<=66){ r=255; g=99.4708025861*Math.log(t)-161.1195681661; b = t<=19 ? 0 : 138.5177312231*Math.log(t-10)-305.0447927307; }
    else { r=329.698727446*Math.pow(t-60,-0.1332047592); g=288.1221695283*Math.pow(t-60,-0.0755148492); b=255; }
    const c = new THREE.Color(clamp(r,0,255)/255, clamp(g,0,255)/255, clamp(b,0,255)/255).convertSRGBToLinear();
    const m = Math.max(c.r,c.g,c.b)||1; c.multiplyScalar(1/m);
    return c;
  };
  // Visible wavelength (nm) → sRGB css string
  FX.wavelengthCSS = function(nm){
    let r=0,g=0,b=0;
    if(nm>=380&&nm<440){ r=-(nm-440)/60; b=1; } else if(nm<490){ g=(nm-440)/50; b=1; }
    else if(nm<510){ g=1; b=-(nm-510)/20; } else if(nm<580){ r=(nm-510)/70; g=1; }
    else if(nm<645){ r=1; g=-(nm-645)/65; } else if(nm<=780){ r=1; }
    let f = 1; if(nm<420) f=0.3+0.7*(nm-380)/40; else if(nm>700) f=0.3+0.7*(780-nm)/80;
    const to = v=> Math.round(255*Math.pow(v*f, 0.8));
    return `rgb(${to(r)},${to(g)},${to(b)})`;
  };

  // ---------------------------------------------------------------- GLSL
  FX.glsl = {
    noise: `
      vec3 mod289(vec3 x){ return x - floor(x*(1.0/289.0))*289.0; }
      vec4 mod289(vec4 x){ return x - floor(x*(1.0/289.0))*289.0; }
      vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314*r; }
      float snoise(vec3 v){
        const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx; vec3 x2 = x0 - i2 + C.yyy; vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857; vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0*floor(p*ns.z*ns.z); vec4 x_ = floor(j*ns.z); vec4 y_ = floor(j - 7.0*x_);
        vec4 x = x_*ns.x + ns.yyyy; vec4 y = y_*ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x); vec3 p1 = vec3(a0.zw, h.y); vec3 p2 = vec3(a1.xy, h.z); vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0); m = m*m;
        return 42.0*dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }
      float fbm(vec3 p){ float f=0.0, a=0.5; for(int i=0;i<5;i++){ f+=a*snoise(p); p*=2.02; a*=0.5; } return f; }
      float fbm3(vec3 p){ float f=0.0, a=0.5; for(int i=0;i<3;i++){ f+=a*snoise(p); p*=2.03; a*=0.5; } return f; }
    `,
  };

  // ---------------------------------------------------------------- textures
  function canvasTex(size, draw, opts={}){
    const c = document.createElement('canvas'); c.width = c.height = size;
    const ctx = c.getContext('2d'); draw(ctx, size);
    const t = new THREE.CanvasTexture(c);
    if(opts.srgb) t.encoding = THREE.sRGBEncoding;
    t.needsUpdate = true;
    return t;
  }
  function buildTextures(){
    FX.tex.dot = canvasTex(64, (ctx,s)=>{
      const g = ctx.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);
      g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.35,'rgba(255,255,255,0.6)'); g.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0,0,s,s);
    });
    FX.tex.glow = canvasTex(256, (ctx,s)=>{
      const img = ctx.createImageData(s,s);
      for(let y=0;y<s;y++) for(let x=0;x<s;x++){
        const dx=(x+0.5)/s*2-1, dy=(y+0.5)/s*2-1, d=Math.sqrt(dx*dx+dy*dy);
        const v = Math.max(0, Math.exp(-d*d*6.0) * 0.85 + Math.exp(-d*3.2)*0.35 - 0.02) * (d<1?1:0);
        const i=(y*s+x)*4; img.data[i]=img.data[i+1]=img.data[i+2]=255; img.data[i+3]=Math.round(clamp(v,0,1)*255);
      }
      ctx.putImageData(img,0,0);
    });
    FX.tex.flare = canvasTex(512, (ctx,s)=>{
      const c = s/2;
      const g = ctx.createRadialGradient(c,c,0,c,c,c);
      g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.06,'rgba(255,255,255,0.8)');
      g.addColorStop(0.2,'rgba(255,255,255,0.18)'); g.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=g; ctx.fillRect(0,0,s,s);
      ctx.globalCompositeOperation='lighter';
      [[0,1],[Math.PI/2,1],[Math.PI/4,0.35],[-Math.PI/4,0.35]].forEach(([a,k])=>{
        ctx.save(); ctx.translate(c,c); ctx.rotate(a);
        const lg = ctx.createLinearGradient(-c,0,c,0);
        lg.addColorStop(0,'rgba(255,255,255,0)'); lg.addColorStop(0.5,`rgba(255,255,255,${0.55*k})`); lg.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle = lg; ctx.fillRect(-c, -1.6*k, s, 3.2*k); ctx.restore();
      });
    });
    FX.tex.ring = canvasTex(256, (ctx,s)=>{
      const c=s/2; const g = ctx.createRadialGradient(c,c,c*0.62,c,c,c);
      g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(0.55,'rgba(255,255,255,0.9)'); g.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=g; ctx.fillRect(0,0,s,s);
    });
    // wispy fbm cloud sprite for nebulae / smoke / vapour
    FX.tex.cloud = canvasTex(256, (ctx,s)=>{
      const img = ctx.createImageData(s,s);
      const rnd = mulberry(7);
      const grid = 16, vals = []; for(let i=0;i<(grid+1)*(grid+1);i++) vals.push(rnd());
      const vn = (x,y)=>{ const xi=Math.floor(x)%grid, yi=Math.floor(y)%grid, xf=x-Math.floor(x), yf=y-Math.floor(y);
        const a=vals[yi*(grid+1)+xi], b=vals[yi*(grid+1)+xi+1], c=vals[(yi+1)*(grid+1)+xi], d=vals[(yi+1)*(grid+1)+xi+1];
        const u=xf*xf*(3-2*xf), v=yf*yf*(3-2*yf); return lerp(lerp(a,b,u), lerp(c,d,u), v); };
      for(let y=0;y<s;y++) for(let x=0;x<s;x++){
        let f=0, amp=0.5, fr=4/s*grid/4; for(let o=0;o<5;o++){ f+=amp*vn(x*fr*(1<<o)%grid, y*fr*(1<<o)%grid); amp*=0.5; }
        const dx=(x+0.5)/s*2-1, dy=(y+0.5)/s*2-1, d=Math.sqrt(dx*dx+dy*dy);
        const fall = Math.max(0, 1-d); const v = clamp((f-0.28)*1.9,0,1) * fall*fall;
        const i=(y*s+x)*4; img.data[i]=img.data[i+1]=img.data[i+2]=255; img.data[i+3]=Math.round(v*255);
      }
      ctx.putImageData(img,0,0);
    });
  }
  function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
  FX.rng = mulberry;

  // ---------------------------------------------------------------- post pipeline
  const FS_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
  let fsScene, fsCam, fsQuad;
  const RT = { scene:null, levels:[] };
  const MAT = {};

  function makeRT(w,h,msaa){
    const isGL2 = FX.renderer.capabilities.isWebGL2;
    const opts = { minFilter:THREE.LinearFilter, magFilter:THREE.LinearFilter, format:THREE.RGBAFormat, type:FX.hdrType, depthBuffer:!!msaa, stencilBuffer:false };
    if(msaa===true && isGL2 && THREE.WebGLMultisampleRenderTarget){
      const rt = new THREE.WebGLMultisampleRenderTarget(w,h,opts); rt.samples = 4; return rt;
    }
    return new THREE.WebGLRenderTarget(w,h,opts);
  }

  function initPost(){
    const r = FX.renderer;
    const isGL2 = r.capabilities.isWebGL2;
    const halfOK = isGL2 ? (r.extensions.has('EXT_color_buffer_float') || r.extensions.has('EXT_color_buffer_half_float'))
                         : (r.extensions.has('OES_texture_half_float') && r.extensions.has('EXT_color_buffer_half_float'));
    FX.hdrType = halfOK ? THREE.HalfFloatType : THREE.UnsignedByteType;
    fsScene = new THREE.Scene(); fsCam = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    fsQuad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2,2), null); fsQuad.frustumCulled = false; fsScene.add(fsQuad);

    MAT.prefilter = new THREE.ShaderMaterial({ vertexShader:FS_VERT, depthTest:false, depthWrite:false,
      uniforms:{ tSrc:{value:null}, threshold:{value:1}, knee:{value:0.5} },
      fragmentShader:`uniform sampler2D tSrc; uniform float threshold, knee; varying vec2 vUv;
        void main(){ vec3 c = texture2D(tSrc, vUv).rgb; float br = max(c.r, max(c.g, c.b));
          float soft = clamp(br - threshold + knee, 0.0, 2.0*knee); soft = soft*soft/(4.0*knee + 1e-4);
          float contrib = max(soft, br - threshold) / max(br, 1e-4);
          gl_FragColor = vec4(min(c*contrib, vec3(60.0)), 1.0); }` });
    MAT.down = new THREE.ShaderMaterial({ vertexShader:FS_VERT, depthTest:false, depthWrite:false,
      uniforms:{ tSrc:{value:null}, texel:{value:new THREE.Vector2()} },
      fragmentShader:`uniform sampler2D tSrc; uniform vec2 texel; varying vec2 vUv;
        void main(){ vec2 h = texel*0.5; vec3 s = texture2D(tSrc, vUv).rgb*4.0;
          s += texture2D(tSrc, vUv - h).rgb; s += texture2D(tSrc, vUv + h).rgb;
          s += texture2D(tSrc, vUv + vec2(h.x,-h.y)).rgb; s += texture2D(tSrc, vUv - vec2(h.x,-h.y)).rgb;
          gl_FragColor = vec4(s/8.0, 1.0); }` });
    MAT.up = new THREE.ShaderMaterial({ vertexShader:FS_VERT, depthTest:false, depthWrite:false,
      blending:THREE.AdditiveBlending, transparent:true,
      uniforms:{ tSrc:{value:null}, texel:{value:new THREE.Vector2()}, radius:{value:1}, weight:{value:1} },
      fragmentShader:`uniform sampler2D tSrc; uniform vec2 texel; uniform float radius, weight; varying vec2 vUv;
        void main(){ vec2 h = texel*radius; vec3 s = vec3(0.0);
          s += texture2D(tSrc, vUv + vec2(-h.x*2.0, 0.0)).rgb; s += texture2D(tSrc, vUv + vec2(-h.x, h.y)).rgb*2.0;
          s += texture2D(tSrc, vUv + vec2(0.0, h.y*2.0)).rgb; s += texture2D(tSrc, vUv + vec2(h.x, h.y)).rgb*2.0;
          s += texture2D(tSrc, vUv + vec2(h.x*2.0, 0.0)).rgb; s += texture2D(tSrc, vUv + vec2(h.x, -h.y)).rgb*2.0;
          s += texture2D(tSrc, vUv + vec2(0.0, -h.y*2.0)).rgb; s += texture2D(tSrc, vUv + vec2(-h.x, -h.y)).rgb*2.0;
          gl_FragColor = vec4(s/12.0*weight, 1.0); }` });
    MAT.composite = new THREE.ShaderMaterial({ vertexShader:FS_VERT, depthTest:false, depthWrite:false,
      uniforms:{ tScene:{value:null}, tBloom:{value:null}, bloom:{value:1}, exposure:{value:1}, vignette:{value:0.35},
        grain:{value:0.03}, time:{value:0}, chroma:{value:0}, flash:{value:0}, flashColor:{value:new THREE.Color(1,1,1)},
        aspect:{value:1}, saturation:{value:1} },
      fragmentShader:`uniform sampler2D tScene, tBloom; uniform float bloom, exposure, vignette, grain, time, chroma, flash, aspect, saturation;
        uniform vec3 flashColor; varying vec2 vUv;
        vec3 aces(vec3 x){ const float a=2.51, b=0.03, c=2.43, d=0.59, e=0.14; return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0); }
        vec3 toSRGB(vec3 c){ return mix(c*12.92, 1.055*pow(c, vec3(1.0/2.4)) - 0.055, step(0.0031308, c)); }
        float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
        void main(){
          vec2 d = vUv - 0.5;
          vec3 col;
          if(chroma > 0.0001){
            vec2 off = d * chroma * 0.02;
            col.r = texture2D(tScene, vUv + off).r; col.g = texture2D(tScene, vUv).g; col.b = texture2D(tScene, vUv - off).b;
          } else col = texture2D(tScene, vUv).rgb;
          col += texture2D(tBloom, vUv).rgb * bloom;
          col += flashColor * flash;
          col *= exposure;
          col = aces(col);
          float l = dot(col, vec3(0.2126,0.7152,0.0722)); col = mix(vec3(l), col, saturation);
          col = toSRGB(col);
          vec2 vd = d; vd.x *= aspect; float v = smoothstep(0.95, 0.25, length(vd)*1.05);
          col *= mix(1.0, v, vignette);
          col += (hash(vUv*vec2(1733.0, 997.0) + fract(time*7.1)) - 0.5) * grain;
          gl_FragColor = vec4(col, 1.0);
        }` });
    resizePost();
  }

  function resizePost(){
    const r = FX.renderer;
    r.setPixelRatio(FX.quality.pixelRatio);
    r.setSize(window.innerWidth, window.innerHeight);
    const w = Math.max(2, Math.floor(window.innerWidth * FX.quality.pixelRatio));
    const h = Math.max(2, Math.floor(window.innerHeight * FX.quality.pixelRatio));
    if(RT.scene) RT.scene.dispose();
    RT.levels.forEach(l=>{ l.a.dispose(); l.b && l.b.dispose(); });
    RT.scene = makeRT(w,h, FX.quality.msaa);
    RT.levels = [];
    let lw = w, lh = h;
    for(let i=0;i<FX.quality.levels;i++){
      lw = Math.max(2, Math.floor(lw/2)); lh = Math.max(2, Math.floor(lh/2));
      RT.levels.push({ a: makeRT(lw,lh,false), w:lw, h:lh });
    }
    RT.w = w; RT.h = h;
  }

  function pass(mat, target){
    fsQuad.material = mat;
    FX.renderer.setRenderTarget(target);
    FX.renderer.render(fsScene, fsCam);
  }

  FX.render = function(){
    const r = FX.renderer, P = FX.post;
    r.setRenderTarget(RT.scene);
    r.clear();
    r.render(FX.scene, FX.camera);

    // Bloom: prefilter into level 0, downsample chain, upsample back additively.
    MAT.prefilter.uniforms.tSrc.value = RT.scene.texture;
    MAT.prefilter.uniforms.threshold.value = P.threshold;
    MAT.prefilter.uniforms.knee.value = P.knee;
    pass(MAT.prefilter, RT.levels[0].a);
    for(let i=1;i<RT.levels.length;i++){
      MAT.down.uniforms.tSrc.value = RT.levels[i-1].a.texture;
      MAT.down.uniforms.texel.value.set(1/RT.levels[i-1].w, 1/RT.levels[i-1].h);
      pass(MAT.down, RT.levels[i].a);
    }
    for(let i=RT.levels.length-1;i>0;i--){
      MAT.up.uniforms.tSrc.value = RT.levels[i].a.texture;
      MAT.up.uniforms.texel.value.set(1/RT.levels[i].w, 1/RT.levels[i].h);
      MAT.up.uniforms.radius.value = P.bloomRadius;
      MAT.up.uniforms.weight.value = 0.8;
      fsQuad.material = MAT.up;
      r.setRenderTarget(RT.levels[i-1].a);
      r.autoClear = false; r.render(fsScene, fsCam); r.autoClear = true;
    }

    const C = MAT.composite.uniforms;
    C.tScene.value = RT.scene.texture; C.tBloom.value = RT.levels[0].a.texture;
    C.bloom.value = P.bloomStrength; C.exposure.value = P.exposure; C.vignette.value = P.vignette;
    C.grain.value = P.grain; C.time.value = FX.time; C.chroma.value = P.chroma + P.flash*0.5;
    C.flash.value = P.flash; C.flashColor.value.copy(P.flashColor);
    C.aspect.value = window.innerWidth/window.innerHeight; C.saturation.value = P.saturation;
    pass(MAT.composite, null);
  };

  // ---------------------------------------------------------------- environment
  // A soft studio: dark gradient dome, two large softboxes, a cool rim strip and
  // a warm floor bounce. Metals and glass read as real materials under it.
  function buildStudioEnv(renderer){
    const s = new THREE.Scene();
    const dome = new THREE.Mesh(new THREE.SphereBufferGeometry(50, 32, 16), new THREE.ShaderMaterial({
      side:THREE.BackSide, depthWrite:false,
      vertexShader:`varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader:`varying vec3 vP; void main(){ float y = vP.y;
        vec3 top = vec3(0.06,0.070,0.095); vec3 hor = vec3(0.13,0.135,0.155); vec3 bot = vec3(0.025,0.023,0.021);
        vec3 c = y>0.0 ? mix(hor, top, pow(y,0.6)) : mix(hor, bot, pow(-y,0.5));
        gl_FragColor = vec4(c,1.0); }` }));
    s.add(dome);
    const box = (w,h,col,pos,look)=>{
      const m = new THREE.Mesh(new THREE.PlaneBufferGeometry(w,h), new THREE.MeshBasicMaterial({ color:col, side:THREE.DoubleSide }));
      m.position.copy(pos); m.lookAt(look||new THREE.Vector3()); s.add(m);
    };
    box(18, 12, new THREE.Color(2.0,1.92,1.80), new THREE.Vector3(-14, 16, 12));  // key softbox (warm white, big and soft)
    box(12, 12, new THREE.Color(0.75,0.85,1.05), new THREE.Vector3(18, 6, 10));   // fill (cool)
    box(3, 26, new THREE.Color(1.5,1.7,2.1), new THREE.Vector3(6, 4, -22));       // rim strip
    box(40, 6, new THREE.Color(0.22,0.17,0.13), new THREE.Vector3(0, -18, 6));    // floor bounce
    box(8, 3, new THREE.Color(1.1,1.1,1.15), new THREE.Vector3(0, 24, -2));       // top strip
    box(5, 14, new THREE.Color(0.55,0.62,0.85), new THREE.Vector3(-22, 2, -6));   // cool edge
    box(9, 4, new THREE.Color(0.9,0.72,0.5), new THREE.Vector3(10, -6, 16));      // warm low kick
    box(2, 18, new THREE.Color(1.3,1.25,1.15), new THREE.Vector3(-8, 6, 20));     // narrow specular line
    box(30, 22, new THREE.Color(0.26,0.28,0.34), new THREE.Vector3(0, 4, 30));    // broad front fill — keeps grey metals grey, not black
    // Rendered with a cube camera rather than PMREM: r128's PMREM path stores
    // RGBE, which decodes to NaN on some drivers and turns every metal black.
    const rt = new THREE.WebGLCubeRenderTarget(256, {
      format: THREE.RGBAFormat, type: FX.hdrType || THREE.UnsignedByteType,
      generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter,
    });
    const cubeCam = new THREE.CubeCamera(0.5, 200, rt);
    const prev = renderer.getRenderTarget();
    const prevTone = renderer.toneMapping, prevEnc = renderer.outputEncoding;
    renderer.toneMapping = THREE.NoToneMapping; renderer.outputEncoding = THREE.LinearEncoding;
    cubeCam.update(renderer, s);
    renderer.toneMapping = prevTone; renderer.outputEncoding = prevEnc;
    renderer.setRenderTarget(prev);
    return rt.texture;
  }
  FX.buildStudioEnv = buildStudioEnv;

  // ---------------------------------------------------------------- frame + tweens
  FX.onFrame = function(fn){ FX.frameFns.add(fn); return ()=> FX.frameFns.delete(fn); };
  FX.update = function(dt){
    FX.dt = dt; FX.time += dt;
    FX.frameFns.forEach(fn=>{ try{ fn(dt, FX.time); }catch(e){ console.error(e); FX.frameFns.delete(fn); } });
    FX.cam.apply(dt);
    FX.updateLabels();
    // The flash decays on wall-clock time, not on the clamped frame delta.
    // On a slow machine dt is capped well below the real frame time, so a
    // dt-driven decay leaves a white veil hanging over the next scene.
    if(FX.post.flash > 0){
      const now = performance.now();
      const real = FX._flashLast ? Math.min(0.5, (now - FX._flashLast)/1000) : dt;
      FX._flashLast = now;
      FX.post.flash = Math.max(0, FX.post.flash - real*FX._flashDecay);
    } else FX._flashLast = 0;
  };

  // animate(durationMs, t=>{}) → Promise ; t in [0,1] eased
  FX.timeScale = 1;
  FX.animate = function(ms, fn, easing){
    const e = easing || ease.inOut;
    ms = ms * FX.timeScale;
    return new Promise(res=>{
      const t0 = performance.now();
      const stop = FX.onFrame(()=>{
        // A Theater skip snaps any in-flight tween straight to its end state
        // on the next frame, instead of making Skip wait out every camera
        // move / fade that happens to be running.
        const skipping = window.Theater && Theater.busy && Theater.skip;
        const k = skipping ? 1 : (ms<=0 ? 1 : clamp((performance.now()-t0)/ms, 0, 1));
        fn(e(k), k);
        if(k>=1){ stop(); res(); }
      });
    });
  };
  FX.tweenValue = function(obj, key, to, ms, easing){
    const from = obj[key];
    return FX.animate(ms, t=>{ obj[key] = lerp(from, to, t); }, easing);
  };

  FX.flash = function(strength=1.2, color='#ffffff', decayPerSec=2.2){
    FX.post.flash = Math.max(FX.post.flash, strength);
    FX.post.flashColor.copy(FX.lin(color));
    FX._flashDecay = decayPerSec;
    FX._flashLast = performance.now();
  };
  FX._flashDecay = 2.2;

  // ---------------------------------------------------------------- camera director
  FX.cam = {
    look: new THREE.Vector3(), shakeAmp:0, shakeT:0, _drift:null,
    set(pos, look){ FX.camera.position.copy(pos); this.look.copy(look||new THREE.Vector3()); FX.camera.lookAt(this.look); if(window.Cosmos) Cosmos._camLookAt.copy(this.look); },
    to(pos, look, ms=1600, easing){
      const p0 = FX.camera.position.clone(), l0 = this.look.clone();
      const l1 = look ? look.clone() : l0.clone();
      this._drift = null;
      return FX.animate(ms, t=>{ FX.camera.position.lerpVectors(p0, pos, t); this.look.lerpVectors(l0, l1, t); }, easing||ease.inOut);
    },
    shake(amp=1, ms=500){ this.shakeAmp = Math.max(this.shakeAmp, amp); this.shakeT = Math.max(this.shakeT, ms/1000); this._shakeDur = ms/1000; },
    // slow orbit around a centre until cleared
    drift(center, radius, height, speed, startAngle){
      this._drift = { c:center.clone(), r:radius, h:height, s:speed, a: startAngle!=null ? startAngle : Math.atan2(FX.camera.position.z-center.z, FX.camera.position.x-center.x) };
    },
    stopDrift(){ this._drift = null; },
    apply(dt){
      if(this._drift){
        const d = this._drift; d.a += d.s*dt;
        FX.camera.position.set(d.c.x + Math.cos(d.a)*d.r, d.c.y + d.h, d.c.z + Math.sin(d.a)*d.r);
        this.look.copy(d.c);
      }
      if(window.Cosmos && Cosmos._autoOrbit && Cosmos._autoOrbit.active) return; // lab orbit owns camera
      FX.camera.lookAt(this.look);
      this._off.set(0,0,0);
      if(this.shakeT > 0){
        this.shakeT -= dt;
        const k = Math.max(0, this.shakeT/(this._shakeDur||0.5)) * this.shakeAmp;
        this._off.set((Math.random()-0.5)*k, (Math.random()-0.5)*k, 0);
        FX.camera.position.add(this._off);
        if(this.shakeT<=0) this.shakeAmp = 0;
      }
      if(window.Cosmos) Cosmos._camLookAt.copy(this.look);
    },
    restore(){ if(this._off.lengthSq()>0){ FX.camera.position.sub(this._off); this._off.set(0,0,0); } },
    _off: new THREE.Vector3(),
  };

  // ---------------------------------------------------------------- labels
  const _v = new THREE.Vector3();
  FX.label = function(html, target, opts={}){
    const layer = document.getElementById('fx-labels');
    const el = document.createElement('div');
    el.className = 'fx-label ' + (opts.cls||'');
    el.innerHTML = html;
    layer.appendChild(el);
    const L = { el, target, offset: opts.offset || [0,0], visible:true, alwaysOn: !!opts.alwaysOn };
    FX.labels.add(L);
    requestAnimationFrame(()=> el.classList.add('show'));
    L.remove = ()=>{ el.classList.remove('show'); FX.labels.delete(L); setTimeout(()=> el.remove(), 400); };
    L.set = h=>{ el.innerHTML = h; };
    return L;
  };
  FX.updateLabels = function(){
    if(!FX.labels.size) return;
    const w = window.innerWidth, h = window.innerHeight;
    FX.camera.updateMatrixWorld();
    FX.labels.forEach(L=>{
      if(L.target.isObject3D){ L.target.getWorldPosition(_v); } else _v.copy(L.target);
      _v.project(FX.camera);
      const behind = _v.z > 1;
      const x = (_v.x*0.5+0.5)*w + L.offset[0], y = (-_v.y*0.5+0.5)*h + L.offset[1];
      L.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%,-50%)`;
      L.el.style.visibility = behind ? 'hidden' : 'visible';
    });
  };

  // ---------------------------------------------------------------- stages
  // A Stage owns scene objects, frame callbacks, labels, DOM nodes and timers
  // created during one sequence, so skip/cleanup is always complete.
  FX.stage = function(name){
    const S = { name, group:new THREE.Group(), fns:[], labels:[], doms:[], timers:[], disposables:[], alive:true };
    S.group.name = 'stage:'+name;
    FX.scene.add(S.group);
    S.add = (o, parent)=>{ (parent||S.group).add(o); return o; };
    S.onFrame = fn=>{ const stop = FX.onFrame((dt,t)=>{ if(S.alive) fn(dt,t); }); S.fns.push(stop); return stop; };
    S.label = (html, target, opts)=>{ const L = FX.label(html, target, opts); S.labels.push(L); return L; };
    S.dom = (el, parent)=>{ (parent||document.getElementById('exp-body')).appendChild(el); S.doms.push(el); return el; };
    S.timeout = (fn, ms)=>{ const id = setTimeout(()=>{ if(S.alive) fn(); }, ms); S.timers.push(id); return id; };
    S.track = d=>{ S.disposables.push(d); return d; };
    S.children = [];
    S.sub = (subName)=>{
      const C = FX.stage(subName||('sub'+S.children.length));
      FX.scene.remove(C.group);
      S.group.add(C.group);
      S.children.push(C);
      return C;
    };
    S.clear = ()=>{ S.children.forEach(c=>c.dispose()); S.children.length = 0; };
    S.dispose = ()=>{
      if(!S.alive) return; S.alive = false;
      S.children.forEach(c=>c.dispose()); S.children.length = 0;
      S.fns.forEach(stop=>stop()); S.labels.forEach(L=>L.remove()); S.doms.forEach(el=>el.remove()); S.timers.forEach(clearTimeout);
      if(S.group.parent) S.group.parent.remove(S.group);
      S.group.traverse(o=>{
        if(o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
        if(o.material){ (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{ if(!m.userData.shared) m.dispose(); }); }
      });
      S.disposables.forEach(d=>{ try{ d.dispose ? d.dispose() : d(); }catch(e){} });
    };
    return S;
  };

  // ---------------------------------------------------------------- init + quality
  FX.init = function(renderer, scene, camera){
    FX.renderer = renderer; FX.scene = scene; FX.camera = camera;
    renderer.outputEncoding = THREE.LinearEncoding;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.localClippingEnabled = true;
    renderer.autoClear = true;
    const dpr = window.devicePixelRatio || 1;
    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    FX.quality.pixelRatio = Math.min(dpr, small ? 1.5 : 1.75);
    if(/[?&]hq/.test(location.search)) FX.quality.adaptive = false;
    const fast = location.search.match(/[?&]fast=?([\d.]*)/);
    if(fast) FX.timeScale = fast[1] ? parseFloat(fast[1]) : 0.25;
    if(/[?&]lowfx/.test(location.search)){ FX.quality.pixelRatio = 1; FX.quality.msaa = false; FX.quality.levels = 4; }
    buildTextures();
    initPost();   // sets FX.hdrType, which the environment map reuses
    try { FX.env = buildStudioEnv(renderer); } catch(e){ console.warn('env build failed', e); FX.env = null; }
    window.addEventListener('resize', ()=>{ resizePost(); });
    FX.ready = true;
  };

  // Called by the main loop with the measured frame time; lowers resolution if needed.
  let perfAcc = 0, perfN = 0, perfCooldown = 3;
  FX.adapt = function(dt){
    if(!FX.quality.adaptive) return;
    perfCooldown -= dt; if(perfCooldown > 0) return;
    perfAcc += dt; perfN++;
    if(perfN >= 90){
      const avg = perfAcc/perfN; perfAcc = 0; perfN = 0;
      if(avg > 0.045 && FX.quality.pixelRatio > 0.75){
        FX.quality.pixelRatio = Math.max(0.75, FX.quality.pixelRatio*0.8);
        if(FX.quality.pixelRatio <= 1) FX.quality.msaa = false;
        resizePost(); perfCooldown = 2;
      }
    }
  };
  FX.resizePost = resizePost;

  window.FX = FX;
})();
