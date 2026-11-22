const T=THREE,TAU=Math.PI*2,SYN=29.53,RE=30,RM=5,TILT=23.5*Math.PI/180,$=s=>document.querySelector(s);
const rnd=(x,y)=>{const s=Math.sin(x*127.1+y*311.7)*43758.5453;return s-Math.floor(s)};
function vn(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),a=rnd(xi,yi),b=rnd(xi+1,yi),c=rnd(xi,yi+1),d=rnd(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
function fbm(x,y){let s=0,a=.5;for(let i=0;i<4;i++){s+=a*vn(x,y);x*=2;y*=2;a/=2}return s}
function cvs(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d'),im=g.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const o=(y*w+x)*4,k=fn(x/w,y/h);im.data[o]=k[0];im.data[o+1]=k[1];im.data[o+2]=k[2];im.data[o+3]=k[3]===undefined?255:k[3]}g.putImageData(im,0,0);return c}
const wrapN=(u,v,s)=>fbm(Math.cos(TAU*u)*s+9,Math.sin(TAU*u)*s+v*s*2.2);
const earthC=cvs(384,192,(u,v)=>{const n=wrapN(u,v,1.5);if(Math.abs(v-.5)>.43)return[238,244,250];if(n>.53){const k=(n-.53)*5;return[70+k*110,120+k*30-k*40,60+k*20]}const d=Math.min(1,(.53-n)*3);return[14,50+30*(1-d),120+50*(1-d)]});
const cloudC=cvs(384,192,(u,v)=>{const n=wrapN(u+.3,v,2.2);const a=Math.max(0,(n-.5)*4);return[255,255,255,Math.min(210,a*255)]});
const moonC=cvs(256,128,(u,v)=>{const n=wrapN(u,v,2.5),g=150+n*70;return[g,g,g*.96]});
{const g=moonC.getContext('2d');for(let i=0;i<9;i++){g.fillStyle='rgba(40,40,48,.28)';g.beginPath();g.ellipse(Math.random()*256,20+Math.random()*90,10+Math.random()*22,8+Math.random()*14,0,0,TAU);g.fill()}
for(let i=0;i<90;i++){const x=Math.random()*256,y=Math.random()*128,r=1.5+Math.random()*5;g.fillStyle='rgba(20,20,26,.22)';g.beginPath();g.arc(x,y,r,0,TAU);g.fill();g.strokeStyle='rgba(255,255,255,.2)';g.lineWidth=1;g.beginPath();g.arc(x-.6,y-.6,r,0,TAU);g.stroke()}}
const sunC=cvs(256,128,(u,v)=>{const n=wrapN(u,v,3);return[255,150+n*100,20+n*50]});
const tx=c=>{const t=new T.CanvasTexture(c);return t};
const cv=$('#c'),R=new T.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});R.outputEncoding=T.sRGBEncoding;R.setPixelRatio(Math.min(devicePixelRatio,1.75));
const sc=new T.Scene(),cam=new T.PerspectiveCamera(50,1,.1,1500);
const amb=new T.AmbientLight(0x8899bb,.12);sc.add(amb);
const hemi=new T.HemisphereLight(0x9ebeff,0x171827,.12);sc.add(hemi);
const light=new T.PointLight(0xffffff,1.5,0,0);sc.add(light);
{const n=1100,p=new Float32Array(n*3);for(let i=0;i<n;i++){const a=Math.random()*TAU,b=Math.acos(2*Math.random()-1);p[i*3]=900*Math.sin(b)*Math.cos(a);p[i*3+1]=900*Math.cos(b);p[i*3+2]=900*Math.sin(b)*Math.sin(a)}
const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));sc.add(new T.Points(g,new T.PointsMaterial({color:0xffffff,size:1.6,sizeAttenuation:false})))}
let glow;const sun=new T.Mesh(new T.SphereGeometry(6,40,28),new T.MeshBasicMaterial({map:tx(sunC)}));sc.add(sun);
{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=g.createRadialGradient(64,64,10,64,64,64);r.addColorStop(0,'rgba(255,200,80,.9)');r.addColorStop(.4,'rgba(255,150,40,.3)');r.addColorStop(1,'rgba(255,120,0,0)');g.fillStyle=r;g.fillRect(0,0,128,128);
const s=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),blending:T.AdditiveBlending,depthWrite:false}));s.scale.set(30,30,1);sun.add(s);glow=s}
const earthP=new T.Group(),tilt=new T.Group();tilt.rotation.z=TILT;earthP.add(tilt);sc.add(earthP);
const globe=new T.Mesh(new T.SphereGeometry(1.5,40,28),new T.MeshPhongMaterial({map:tx(earthC),shininess:8,specular:0x223344}));
const clouds=new T.Mesh(new T.SphereGeometry(1.53,32,22),new T.MeshPhongMaterial({map:tx(cloudC),transparent:true,depthWrite:false}));
tilt.add(globe,clouds);
tilt.add(new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0,-2.6,0),new T.Vector3(0,2.6,0)]),new T.LineBasicMaterial({color:0x66ccff})));
const moon=new T.Mesh(new T.SphereGeometry(.4,32,24),new T.MeshLambertMaterial({map:tx(moonC)}));sc.add(moon);
const ring=r=>{const p=[];for(let i=0;i<=120;i++)p.push(new T.Vector3(r*Math.cos(i/120*TAU),0,-r*Math.sin(i/120*TAU)));return new T.Line(new T.BufferGeometry().setFromPoints(p),new T.LineBasicMaterial({color:0xa0a4b0,transparent:true,opacity:.35}))};
const ringE=ring(RE),ringM=ring(RM);sc.add(ringE,ringM);
const vg=new T.BufferGeometry();vg.setAttribute('position',new T.BufferAttribute(new Float32Array(6),3));
const vline=new T.Line(vg,new T.LineBasicMaterial({color:0x4de1ff}));vline.frustumCulled=false;sc.add(vline);
const SPD=[[1/86400,'الزمن الحقيقي'],[1/24,'ساعة في الثانية'],[.25,'6 ساعات في الثانية'],[1,'يوم في الثانية'],[7,'أسبوع في الثانية'],[SYN/3,'شهر في 3 ثوانٍ']];
const CAP={1:'المقياس توضيحي: الأحجام والمسافات مكبّرة وليست بالمقياس الحقيقي. اسحب للتدوير، واقرص للتكبير، واسحب بإصبعين للتحريك.',2:'القمر كما يراه راصد في نصف الكرة الشمالي. الطور يتغير لأن زاوية رؤيتنا للنصف المضاء تتغير.',3:'منظور علوي: النصف المواجه للشمس مضاء دائماً، والخط الأزرق اتجاه نظرنا من الأرض. الأطوار ليست ظل الأرض.'};
const views={1:{th:.6,ph:1.05,d:78,pan:new T.Vector3()},3:{th:0,ph:.12,d:17,pan:new T.Vector3()}};
const NM=['المحاق','الهلال المتزايد','التربيع الأول','الأحدب المتزايد','البدر','الأحدب المتناقص','التربيع الأخير','الهلال المتناقص'],EM=['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘'];
let t=0,si=3,playing=true,mode=1,E=new T.Vector3(),M=new T.Vector3(),psi=0;
const strip=$('#strip');EM.forEach((e,i)=>{const s=document.createElement('span');s.textContent=e;s.title=NM[i];s.onclick=()=>{t=t-dayOf(t)+i*SYN/8};strip.appendChild(s)});
const dayOf=x=>((x%SYN)+SYN)%SYN;
function setMode(m){mode=m;document.querySelectorAll('#top button').forEach(b=>b.classList.toggle('on',b.dataset.m==m));$('#cap').textContent=CAP[m];earthP.visible=m!=2;vline.visible=m==3;ringE.visible=m==1;ringM.visible=m!=2}
document.querySelectorAll('#top button').forEach(b=>b.onclick=()=>setMode(+b.dataset.m));
$('#bPlay').onclick=()=>playing=true;$('#bStop').onclick=()=>playing=false;$('#bRst').onclick=()=>{t=0};
$('#bSlow').onclick=()=>si=Math.max(0,si-1);$('#bFast').onclick=()=>si=Math.min(SPD.length-1,si+1);
$('#sl').oninput=e=>{t=t-dayOf(t)+e.target.value/100};
const P=new Map();
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);P.set(e.pointerId,[e.clientX,e.clientY])});
const up=e=>P.delete(e.pointerId);cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('pointermove',e=>{if(!P.has(e.pointerId)||mode==2)return;const o=P.get(e.pointerId),n=[e.clientX,e.clientY],v=views[mode];
if(P.size==1){v.th-=(n[0]-o[0])*.008;v.ph=Math.min(3.05,Math.max(.08,v.ph-(n[1]-o[1])*.008))}
else if(P.size==2){let q;for(const [k,p] of P)if(k!=e.pointerId)q=p;const d0=Math.hypot(o[0]-q[0],o[1]-q[1]),d1=Math.hypot(n[0]-q[0],n[1]-q[1]);if(d1>0)v.d=Math.min(220,Math.max(5,v.d*d0/d1));
const k=v.d*.0014,rt=new T.Vector3().setFromMatrixColumn(cam.matrix,0),upv=new T.Vector3().setFromMatrixColumn(cam.matrix,1);v.pan.addScaledVector(rt,-(n[0]-o[0])/2*k).addScaledVector(upv,(n[1]-o[1])/2*k)}
P.set(e.pointerId,n)});
cv.addEventListener('wheel',e=>{if(mode==2)return;e.preventDefault();const v=views[mode];v.d=Math.min(220,Math.max(5,v.d*(1+e.deltaY*.001)))},{passive:false});
function resize(){const w=document.documentElement.clientWidth||innerWidth,h=document.documentElement.clientHeight||innerHeight;R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}addEventListener('resize',resize);resize();
function drawMoon(d){const c=$('#mc'),g=c.getContext('2d'),W=192,r=86,cx=96,cy=96,cp=Math.cos(psi),wax=d<SYN/2;
g.clearRect(0,0,W,W);g.fillStyle='#232838';g.beginPath();g.arc(cx,cy,r,0,TAU);g.fill();g.fillStyle='#ece8d6';
for(let y=-r;y<r;y++){const w=Math.sqrt(r*r-y*y),xt=cp*w,wd=w-xt;if(wd<=0)continue;g.fillRect(wax?cx+xt:cx-w,cy+y,wd,1.2)}
g.strokeStyle='rgba(150,170,220,.4)';g.beginPath();g.arc(cx,cy,r,0,TAU);g.stroke()}
const LD={S:70,E:70,M:70,A:25},LT={...LD},LC={...LD},ids={S:'#lS',E:'#lE',M:'#lM',A:'#lA'};
Object.keys(ids).forEach(k=>{const el=$(ids[k]);el.oninput=()=>{LT[k]=+el.value;el.nextElementSibling.textContent=el.value+'%'};el.oninput()});
$('#ltR').onclick=()=>Object.keys(ids).forEach(k=>{const el=$(ids[k]);el.value=LD[k];el.oninput()});
$('#bLt').onclick=()=>{const o=$('#lt').classList.toggle('on');document.body.classList.toggle('lt',o);$('#bLt').style.background=o?'rgba(242,193,78,.3)':''};
function applyLight(dt){const f=1-Math.exp(-dt*9);for(const k in LC)LC[k]+=(LT[k]-LC[k])*f;
const s=LC.S/70;light.intensity=1.5*s;sun.material.color.setScalar(.12+.88*s);glow.material.opacity=.04+.66*s;glow.scale.setScalar(24+18*s);
const ambient=.08+.42*(LC.A/100);amb.intensity=ambient;hemi.intensity=.06+.24*(LC.A/100);
globe.material.color.setScalar(.12+.88*LC.E/70);clouds.material.color.setScalar(.15+.85*LC.E/70);moon.material.color.setScalar(.12+.88*LC.M/70)}
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.05,(now-(frame.l||now))/1000);frame.l=now;if(playing)t+=SPD[si][0]*dt;
const a=TAU*t/365.25,m=a+Math.PI+TAU*t/SYN,d=dayOf(t);psi=TAU*d/SYN;
E.set(RE*Math.cos(a),0,-RE*Math.sin(a));M.set(E.x+RM*Math.cos(m),0,E.z-RM*Math.sin(m));
earthP.position.copy(E);globe.rotation.y=TAU*t;clouds.rotation.y=TAU*t*1.03;moon.position.copy(M);moon.rotation.y=m+Math.PI;ringM.position.copy(E);sun.rotation.y=t*.02;
const va=vg.attributes.position.array;va[0]=E.x;va[1]=0;va[2]=E.z;va[3]=M.x;va[4]=0;va[5]=M.z;vg.attributes.position.needsUpdate=true;
if(mode==2){const dir=M.clone().sub(E).normalize(),asp=cam.aspect;cam.position.copy(E).addScaledVector(dir,1.7);cam.up.set(0,1,0);cam.lookAt(M);cam.fov=2*Math.atan(Math.tan(.2)/Math.min(1,asp))*180/Math.PI}
else{const v=views[mode];if(mode==3)v.th=a+(v.off||0);const tg=(mode==3?E:new T.Vector3()).clone().add(v.pan);cam.position.set(tg.x+v.d*Math.sin(v.ph)*Math.sin(v.th),tg.y+v.d*Math.cos(v.ph),tg.z+v.d*Math.sin(v.ph)*Math.cos(v.th));cam.up.set(0,1,0);cam.lookAt(tg);cam.fov=50}
applyLight(dt);cam.updateProjectionMatrix();cam.updateMatrix();R.render(sc,cam);
const pi=Math.round(d/(SYN/8))%8;
$('#iD').textContent=(d+1).toFixed(1)+' / 29.5';
if(document.activeElement!==$('#sl'))$('#sl').value=Math.round(d*100);
[...strip.children].forEach((s,i)=>s.classList.toggle('on',i==pi));$('#sp').textContent=SPD[si][1];drawMoon(d)}
setMode(1);requestAnimationFrame(frame);