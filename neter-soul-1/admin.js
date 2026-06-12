/* ═══════════════════════════════════════════════════════
   SOUL · NETER — Admin Panel v4
   - Cliente REST único, sem CDN, sem race condition
   - Conecta ao Supabase imediatamente no carregamento
   - Credenciais: admin@neter.com / admin123
═══════════════════════════════════════════════════════ */

/* ── Supabase ── */
var SB_URL = "https://tfrnbljrxivacubnexeh.supabase.co";
var SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmcm5ibGpyeGl2YWN1Ym5leGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDE0MzQsImV4cCI6MjA5NTkxNzQzNH0.jt1603Yn9qM7A3sS9SwODzAygfTvNvK7Hm9E_rRCedw";
var SB_H   = {"apikey":SB_KEY,"Authorization":"Bearer "+SB_KEY,"Content-Type":"application/json"};

function sbFrom(table){
  var _sel="*", _ord=null, _lim=null, _filters=[];
  var q = {
    select:function(s){ _sel=s; return q; },
    order:function(col,opts){ _ord=col+(opts&&opts.ascending===false?".desc":".asc"); return q; },
    limit:function(n){ _lim=n; return q; },
    eq:function(col,val){ _filters.push(col+"=eq."+encodeURIComponent(val)); return q; },
    upsert:function(data,opts){
      var url=SB_URL+"/rest/v1/"+table+(opts&&opts.onConflict?"?on_conflict="+opts.onConflict:"");
      return fetch(url,{method:"POST",headers:Object.assign({},SB_H,{"Prefer":"resolution=merge-duplicates,return=representation"}),body:JSON.stringify(data)})
        .then(function(r){ return r.json().catch(function(){ return []; }); })
        .then(function(d){ return {data:d,error:null}; })
        .catch(function(e){ return {data:null,error:{message:e.message}}; });
    },
    insert:function(data){
      return fetch(SB_URL+"/rest/v1/"+table,{method:"POST",headers:Object.assign({},SB_H,{"Prefer":"return=representation"}),body:JSON.stringify(data)})
        .then(function(r){ return r.json().catch(function(){ return []; }); })
        .then(function(d){ return {data:d,error:null}; })
        .catch(function(e){ return {data:null,error:{message:e.message}}; });
    },
    then:function(resolve){
      var url=SB_URL+"/rest/v1/"+table+"?select="+encodeURIComponent(_sel);
      _filters.forEach(function(f){ url+="&"+f; });
      if(_ord) url+="&order="+_ord;
      if(_lim) url+="&limit="+_lim;
      fetch(url,{headers:SB_H})
        .then(function(r){ return r.json(); })
        .then(function(d){ resolve({data:Array.isArray(d)?d:[],error:null}); })
        .catch(function(e){ resolve({data:[],error:{message:e.message}}); });
      return q;
    }
  };
  return q;
}

var sb = {
  from: sbFrom,
  auth:{
    signInWithPassword:function(creds){
      return fetch(SB_URL+"/auth/v1/token?grant_type=password",{method:"POST",headers:SB_H,body:JSON.stringify(creds)})
        .then(function(r){ return r.json(); })
        .then(function(d){ return d.error?{data:null,error:d}:{data:{user:d.user},error:null}; })
        .catch(function(e){ return {data:null,error:{message:e.message}}; });
    },
    signOut:function(){ return Promise.resolve(); }
  }
};

var SB_ONLINE = false;
fetch(SB_URL+"/rest/v1/profiles?select=id&limit=1",{headers:SB_H})
  .then(function(r){ SB_ONLINE = r.ok || r.status===406; updateConnStatus(); })
  .catch(function(){ SB_ONLINE = false; updateConnStatus(); });

function updateConnStatus(){
  var el = document.getElementById('adConnStatus');
  if(!el) return;
  el.textContent = SB_ONLINE ? '● Supabase conectado' : '○ Modo local';
  el.style.color  = SB_ONLINE ? '#6ab87a' : 'var(--gold)';
}

/* ── utils ── */
var AD_USER = null;
function $(id){ return document.getElementById(id); }
function fmt(n){ return Number(n||0).toLocaleString('pt-BR'); }
function fmtDate(s){ if(!s) return '—'; var d=new Date(s); return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'})+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); }
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function toast(msg,err){
  var t=$('adToast'); if(!t) return;
  t.textContent=msg; t.className='toast'+(err?' err':'');
  t.style.display='flex'; clearTimeout(t._t);
  t._t=setTimeout(function(){ t.style.display='none'; },3500);
}
function closeModal(){ var m=$('adModal'); if(m) m.style.display='none'; }
function openModal(title,body,ft){
  $('adModalTitle').textContent=title;
  $('adModalBody').innerHTML=body;
  $('adModalFt').innerHTML=ft||'<button class="btn btn-outline" onclick="closeModal()">Fechar</button>';
  $('adModal').style.display='flex';
}
function loading(){ return '<div style="color:var(--txt2);font-size:13px;padding:20px">Carregando...</div>'; }
function sCard(icon,color,val,lbl){
  return '<div class="stat-card"><div class="stat-ico '+color+'"><i class="ti '+icon+'"></i></div><div class="stat-val">'+val+'</div><div class="stat-lbl">'+lbl+'</div></div>';
}

/* ── query helper ── */
async function qry(table, select, opts){
  try{
    var q=sb.from(table).select(select||'*');
    if(opts&&opts.eq)    q=q.eq(opts.eq[0],opts.eq[1]);
    if(opts&&opts.order) q=q.order(opts.order,{ascending:false});
    if(opts&&opts.limit) q=q.limit(opts.limit);
    var res = await q;
    if(res.error){ console.warn('[admin]',table,res.error.message); return []; }
    return res.data||[];
  }catch(e){ console.warn('[admin] qry',e.message); return []; }
}

/* ══════════════════ AUTH ══════════════════ */
async function doLogin(){
  var email=($('adEmail').value||'').trim();
  var pass=$('adPass').value||'';
  var btn=document.querySelector('#adLogin .btn-gold');
  btn.textContent='Entrando...'; btn.disabled=true;

  var saved={}; try{ saved=JSON.parse(localStorage.getItem('soul_admin_config')||'{}'); }catch(e){}
  var creds=saved.admin||(window.siteConfig&&window.siteConfig.admin)||{email:'admin@neter.com',password:'admin123'};

  if(email===creds.email && pass===creds.password){
    AD_USER={email:email,name:'Admin'};
    try{ sessionStorage.setItem('soul_admin_session','1'); }catch(e){}
    showApp(); btn.textContent='Entrar'; btn.disabled=false; return;
  }

  var err=$('adErr');
  if(err){ err.textContent='E-mail ou senha incorretos.'; err.style.display='block'; setTimeout(function(){ err.style.display='none'; },3000); }
  btn.textContent='Entrar'; btn.disabled=false;
}

function doLogout(){
  try{ sessionStorage.removeItem('soul_admin_session'); }catch(e){}
  AD_USER=null;
  $('adApp').classList.add('hidden');
  $('adLogin').classList.remove('hidden');
}

function showApp(){
  $('adLogin').classList.add('hidden');
  $('adApp').classList.remove('hidden');
  updateConnStatus();
  renderNav();
  route('dashboard');
}

/* ══════════════════ NAV ══════════════════ */
var NAV=[
  {section:'Visão Geral'},
  {id:'dashboard',label:'Dashboard',icon:'ti-layout-dashboard'},
  {section:'Usuários'},
  {id:'users',label:'Usuários',icon:'ti-users'},
  {id:'credits',label:'Créditos',icon:'ti-coins'},
  {section:'Conteúdo'},
  {id:'anna',label:'Conversas Anna',icon:'ti-message-circle-2'},
  {id:'analysis',label:'Análises Sistêmicas',icon:'ti-topology-star-3'},
  {section:'Plataforma'},
  {id:'therapists',label:'Terapeutas',icon:'ti-stethoscope'},
  {id:'store',label:'Loja SOUL',icon:'ti-shopping-bag'},
  {id:'config',label:'Configurações',icon:'ti-settings'},
];

function renderNav(){
  var html='';
  NAV.forEach(function(n){
    if(n.section){ html+='<div class="sb-section">'+n.section+'</div>'; return; }
    html+='<div class="nav-item" id="nav-'+n.id+'" onclick="route(\''+n.id+'\')"><i class="ti '+n.icon+'"></i>'+n.label+'</div>';
  });
  $('adNav').innerHTML=html;
  var md=$('mobDrawerNav'); if(md) md.innerHTML=html.replace(/onclick="route\(/g,'onclick="closeMobMenu();route(');
}

function route(id){
  document.querySelectorAll('.nav-item,.mob-tab').forEach(function(el){ el.classList.remove('on'); });
  var ni=$('nav-'+id); if(ni) ni.classList.add('on');
  var mt=$('mobt-'+id); if(mt) mt.classList.add('on');
  var labels={dashboard:'Dashboard',users:'Usuários',credits:'Créditos',anna:'Conversas Anna Goldi',analysis:'Análises Sistêmicas',therapists:'Terapeutas Humanos',store:'Loja SOUL',config:'Configurações'};
  $('adPageTitle').textContent=labels[id]||id;
  var pages={dashboard:pgDashboard,users:pgUsers,credits:pgCredits,anna:pgAnna,analysis:pgAnalysis,therapists:pgTherapists,store:pgStore,config:pgConfig};
  if(pages[id]) pages[id]();
}

/* ══════════════════ DASHBOARD ══════════════════ */
async function pgDashboard(){
  $('adContent').innerHTML=loading();
  var res = await Promise.all([
    qry('profiles','id'),
    qry('anna_conversations','id'),
    qry('systemic_analysis','id'),
    qry('credit_transactions','amount',{eq:['type','purchase']})
  ]);
  var users=res[0].length, convs=res[1].length, analyses=res[2].length;
  var credits=res[3].reduce(function(a,t){ return a+(t.amount>0?t.amount:0); },0);
  $('adContent').innerHTML=
    '<div class="grid-4">'+
      sCard('ti-users','gr',fmt(users),'Usuários cadastrados')+
      sCard('ti-message-circle-2','b',fmt(convs),'Conversas Anna')+
      sCard('ti-topology-star-3','g',fmt(analyses),'Análises Sistêmicas')+
      sCard('ti-coins','g',fmt(credits),'Créditos comprados')+
    '</div>'+
    '<div class="tbl-wrap"><div class="tbl-head"><div class="tbl-title">Base de Dados</div></div>'+
    '<div style="padding:20px;font-size:13px;color:var(--txt2)">'+
      (SB_ONLINE?'Conectado ao Supabase ✓ — '+users+' usuários registrados.':'Carregando conexão...')+
    '</div></div>';
}

/* ══════════════════ USUÁRIOS ══════════════════ */
var _users=[];
async function pgUsers(){
  $('adContent').innerHTML=loading();
  _users = await qry('profiles','id,name,email,created_at,phone',{order:'created_at',limit:200});
  if(_users.length){
    var creds=await qry('user_credits','user_id,balance');
    var cm={}; creds.forEach(function(c){ cm[c.user_id]=c.balance; });
    _users.forEach(function(u){ u._credits=cm[u.id]||0; });
  }
  renderUsers(_users);
}

function renderUsers(list){
  var rows=list.length
    ? list.map(function(u){
        return '<tr>'+
          '<td><strong>'+esc(u.name||'—')+'</strong></td>'+
          '<td style="color:var(--txt2);font-size:12px">'+esc(u.email||'—')+'</td>'+
          '<td><span class="badge badge-gold">✦ '+fmt(u._credits||0)+'</span></td>'+
          '<td style="color:var(--txt2);font-size:12px">'+fmtDate(u.created_at)+'</td>'+
          '<td><button class="btn btn-outline btn-sm" onclick="viewUser(\''+u.id+'\')">Ver</button></td>'+
        '</tr>';
      }).join('')
    : '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--txt2)">Nenhum usuário encontrado.</td></tr>';
  $('adContent').innerHTML=
    '<div class="search-row">'+
      '<input class="search-inp" placeholder="Buscar..." oninput="filterUsers(this.value)">'+
      '<span style="font-size:12px;color:var(--txt2)">'+list.length+' usuários</span>'+
    '</div>'+
    '<div class="tbl-wrap"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Créditos</th><th>Cadastro</th><th></th></tr></thead>'+
    '<tbody>'+rows+'</tbody></table></div>';
}

function filterUsers(q){
  var f=q.toLowerCase();
  renderUsers(_users.filter(function(u){ return (u.name||'').toLowerCase().includes(f)||(u.email||'').toLowerCase().includes(f); }));
}

async function viewUser(id){
  var u=_users.find(function(x){ return x.id===id; }); if(!u) return;
  var body='<div style="margin-bottom:16px">'+
    '<div style="font-family:Fraunces,serif;font-size:1.1rem;font-weight:700">'+esc(u.name||'—')+'</div>'+
    '<div style="font-size:12px;color:var(--txt2)">'+esc(u.email||'—')+'</div>'+
    '<div style="margin-top:8px"><span class="badge badge-gold">✦ '+fmt(u._credits||0)+' créditos</span></div>'+
    '</div>'+
    '<div style="margin-top:16px;padding:14px;background:rgba(196,165,90,.06);border:1px solid rgba(196,165,90,.15);border-radius:10px">'+
      '<div style="font-size:12px;font-weight:600;margin-bottom:10px;color:var(--txt)">Ajustar Créditos</div>'+
      '<div style="display:flex;gap:8px">'+
        '<input class="inp" id="adjAmt" type="number" placeholder="Ex: 100 ou -50" style="flex:1">'+
        '<input class="inp" id="adjDesc" type="text" placeholder="Motivo" style="flex:2">'+
      '</div>'+
    '</div>';
  openModal('Usuário: '+esc(u.name||'—'),body,
    '<button class="btn btn-outline" onclick="closeModal()">Fechar</button>'+
    '<button class="btn btn-gold" onclick="ajustarCreditos(\''+id+'\')">Ajustar Créditos</button>');
}

async function ajustarCreditos(uid){
  var amt=parseInt($('adjAmt').value), desc=($('adjDesc').value||'Ajuste admin').trim();
  if(!amt||isNaN(amt)){ toast('Informe um valor.',true); return; }
  try{
    var u=_users.find(function(x){ return x.id===uid; });
    var newBal=Math.max(0,(u._credits||0)+amt);
    await sb.from('user_credits').upsert({user_id:uid,balance:newBal},{onConflict:'user_id'});
    await sb.from('credit_transactions').insert({user_id:uid,amount:amt,type:'admin_adjust',description:desc});
    toast('Créditos ajustados!'); closeModal(); pgUsers();
  }catch(e){ toast('Erro: '+e.message,true); }
}

/* ══════════════════ CRÉDITOS ══════════════════ */
async function pgCredits(){
  $('adContent').innerHTML=loading();
  var txs=await qry('credit_transactions','amount,type,description,created_at,user_id',{order:'created_at',limit:100});
  var totalIn=txs.reduce(function(a,t){ return a+(t.amount>0?t.amount:0); },0);
  var totalOut=Math.abs(txs.reduce(function(a,t){ return a+(t.amount<0?t.amount:0); },0));
  var rows=txs.length
    ? txs.map(function(t){
        var amt=t.amount>0?'<span style="color:#6ab87a">+'+fmt(t.amount)+'</span>':'<span style="color:var(--red)">'+fmt(t.amount)+'</span>';
        var tipos={purchase:'<span class="badge badge-green">Compra</span>',bonus:'<span class="badge badge-gold">Bônus</span>',admin_adjust:'<span class="badge badge-gray">Admin</span>',session_usage:'<span class="badge badge-blue">Sessão</span>'};
        return '<tr><td>'+amt+'</td><td>'+(tipos[t.type]||esc(t.type))+'</td><td style="font-size:12px;color:var(--txt2)">'+esc(t.description||'—')+'</td><td style="font-size:12px;color:var(--txt2)">'+fmtDate(t.created_at)+'</td></tr>';
      }).join('')
    : '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--txt2)">Nenhuma transação.</td></tr>';
  $('adContent').innerHTML=
    '<div class="grid-3" style="margin-bottom:20px">'+
      sCard('ti-trending-up','gr',fmt(totalIn),'Créditos recebidos')+
      sCard('ti-trending-down','r',fmt(totalOut),'Créditos consumidos')+
      sCard('ti-activity','b',fmt(txs.length),'Transações')+
    '</div>'+
    '<div class="tbl-wrap"><div class="tbl-head"><div class="tbl-title">Histórico</div></div>'+
    '<table><thead><tr><th>Valor</th><th>Tipo</th><th>Descrição</th><th>Data</th></tr></thead>'+
    '<tbody>'+rows+'</tbody></table></div>';
}

/* ══════════════════ ANNA ══════════════════ */
var _convs=[];
async function pgAnna(){
  $('adContent').innerHTML=loading();
  _convs=await qry('anna_conversations','id,created_at,credits_used,summary,messages',{order:'created_at',limit:100});
  renderConvs(_convs);
}
function renderConvs(list){
  var rows=list.length
    ? list.map(function(c){
        var msgs=(c.messages||[]).length;
        var sum=c.summary?esc(c.summary.substring(0,70))+'…':'—';
        return '<tr>'+
          '<td>'+msgs+' msgs</td>'+
          '<td><span class="badge badge-gold">✦ '+fmt(c.credits_used)+'</span></td>'+
          '<td style="font-size:11px;color:var(--txt2)">'+sum+'</td>'+
          '<td>'+fmtDate(c.created_at)+'</td>'+
          '<td><button class="btn btn-outline btn-sm" onclick="viewConv(\''+c.id+'\')">Ver</button></td>'+
        '</tr>';
      }).join('')
    : '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--txt2)">Nenhuma conversa.</td></tr>';
  $('adContent').innerHTML=
    '<div class="tbl-wrap"><table><thead><tr><th>Msgs</th><th>Créditos</th><th>Resumo</th><th>Data</th><th></th></tr></thead>'+
    '<tbody>'+rows+'</tbody></table></div>';
}
function viewConv(id){
  var c=_convs.find(function(x){ return x.id===id; }); if(!c) return;
  var msgs=(c.messages||[]);
  var body=(c.summary?'<div style="background:rgba(196,165,90,.07);border:1px solid rgba(196,165,90,.15);border-radius:9px;padding:12px;font-size:12px;color:var(--txt2);margin-bottom:14px;line-height:1.65"><strong style="color:var(--gold)">Resumo:</strong> '+esc(c.summary)+'</div>':'')+
    '<div style="max-height:400px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding:4px">'+
    (msgs.length?msgs.map(function(m){
      var u=m.role==='user';
      return '<div style="max-width:85%;'+(u?'margin-left:auto':'')+'"><div style="font-size:9px;font-weight:700;letter-spacing:.1em;color:var(--txt2);margin-bottom:3px">'+(u?'USUÁRIO':'ANNA')+'</div>'+
        '<div style="padding:10px 14px;border-radius:'+(u?'14px 4px 14px 14px':'4px 14px 14px 14px')+';background:'+(u?'var(--gold)':'rgba(255,255,255,.07)')+';color:'+(u?'#1a2a14':'rgba(240,236,224,.9)')+';font-size:12px;line-height:1.65">'+esc(m.content||'')+'</div></div>';
    }).join(''):'<div style="color:var(--txt2);font-size:12px">Sem mensagens salvas.</div>')+
    '</div>';
  openModal('Conversa Anna',body);
}

/* ══════════════════ ANÁLISES ══════════════════ */
var _analyses=[];
async function pgAnalysis(){
  $('adContent').innerHTML=loading();
  _analyses=await qry('systemic_analysis','id,created_at,status,result',{order:'created_at',limit:100});
  var rows=_analyses.length
    ? _analyses.map(function(a){
        var res=a.result||{};
        var perfil=(res.retrato&&res.retrato.perfil_dominante)?esc(res.retrato.perfil_dominante):'—';
        return '<tr>'+
          '<td>'+perfil+'</td>'+
          '<td><span class="badge '+(a.status==='completed'?'badge-green':'badge-gray')+'">'+esc(a.status||'—')+'</span></td>'+
          '<td>'+fmtDate(a.created_at)+'</td>'+
          '<td><button class="btn btn-outline btn-sm" onclick="viewAnalysis(\''+a.id+'\')">Ver</button></td>'+
        '</tr>';
      }).join('')
    : '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--txt2)">Nenhuma análise.</td></tr>';
  $('adContent').innerHTML=
    '<div class="tbl-wrap"><table><thead><tr><th>Perfil</th><th>Status</th><th>Data</th><th></th></tr></thead>'+
    '<tbody>'+rows+'</tbody></table></div>';
}
function viewAnalysis(id){
  var a=_analyses.find(function(x){ return x.id===id; }); if(!a) return;
  var res=a.result||{};
  var body='<div style="font-size:12px;color:var(--txt2);margin-bottom:14px">'+fmtDate(a.created_at)+' · <span class="badge badge-'+(a.status==='completed'?'green':'gray')+'">'+esc(a.status)+'</span></div>';
  if(res.retrato) body+='<div class="section"><div class="section-title">Retrato Psíquico</div>'+(res.retrato.perfil_dominante?'<div style="margin-bottom:8px"><span class="badge badge-gold">'+esc(res.retrato.perfil_dominante)+'</span></div>':'')+(res.retrato.narrativa?'<div style="font-size:12.5px;color:var(--txt2);line-height:1.7">'+esc(res.retrato.narrativa)+'</div>':'')+'</div>';
  if(!res.retrato) body+='<pre style="font-size:11px;color:var(--txt2);white-space:pre-wrap">'+JSON.stringify(res,null,2).substring(0,1500)+'</pre>';
  openModal('Análise Sistêmica',body);
}

/* ══════════════════ TERAPEUTAS ══════════════════ */
async function pgTherapists(){
  $('adContent').innerHTML=loading();
  var list=window.SOUL_THERAPISTS||[];
  var html='';
  list.filter(function(t){ return t.type!=='_soon'; }).forEach(function(t){
    html+='<div class="section" style="display:flex;align-items:center;gap:16px;padding:16px 20px;margin-bottom:8px">'+
      '<div style="width:48px;height:48px;border-radius:50%;background:'+t.color+';display:flex;align-items:center;justify-content:center;font-family:Fraunces,serif;font-size:18px;font-weight:700;color:#f0ece0;flex-shrink:0">'+t.initials+'</div>'+
      '<div style="flex:1"><div style="font-family:Fraunces,serif;font-size:15px;font-weight:700">'+esc(t.name)+'</div>'+
      '<div style="font-size:12px;color:var(--txt2)">'+esc(t.typeLabel)+'</div>'+
      '<div style="margin-top:5px">'+(t.bio?'<span class="badge badge-green">Perfil completo</span>':'<span class="badge badge-red">Perfil incompleto</span>')+'</div></div>'+
    '</div>';
  });
  $('adContent').innerHTML=html||'<div style="color:var(--txt2);padding:20px">Nenhum terapeuta configurado.</div>';
}

/* ══════════════════ LOJA ══════════════════ */
async function pgStore(){
  $('adContent').innerHTML=loading();
  var audios=(window.siteConfig&&window.siteConfig.lojaAudios)||[];
  var ebooks=(window.siteConfig&&window.siteConfig.lojaEbooks)||[];
  var all=audios.map(function(p){ return Object.assign({},p,{_cat:'Áudio'}); }).concat(ebooks.map(function(p){ return Object.assign({},p,{_cat:'E-book'}); }));
  var rows=all.length
    ? all.map(function(p){
        return '<tr>'+
          '<td><span class="badge '+(p._cat==='Áudio'?'badge-blue':'badge-green')+'">'+p._cat+'</span></td>'+
          '<td><strong>'+esc(p.title||p.name||'—')+'</strong></td>'+
          '<td><span class="badge badge-gold">✦ '+fmt(p.credits||p.price||0)+'</span></td>'+
        '</tr>';
      }).join('')
    : '<tr><td colspan="3" style="text-align:center;padding:24px;color:var(--txt2)">Nenhum produto.</td></tr>';
  $('adContent').innerHTML=
    '<div class="grid-3" style="margin-bottom:20px">'+
      sCard('ti-headphones','b',fmt(audios.length),'Áudios')+
      sCard('ti-book','gr',fmt(ebooks.length),'E-books')+
      sCard('ti-shopping-bag','g',fmt(all.length),'Total')+
    '</div>'+
    '<div class="tbl-wrap"><table><thead><tr><th>Tipo</th><th>Título</th><th>Preço</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}

/* ══════════════════ CONFIG ══════════════════ */
function pgConfig(){
  var sc=window.siteConfig||{};
  $('adContent').innerHTML=
    '<div class="panel">'+
      '<div class="section">'+
        '<div class="section-title">Credenciais Admin</div>'+
        '<div class="section-sub">Login local para este painel</div>'+
        '<div class="form-row">'+
          '<div class="form-field"><label>E-mail</label><input class="inp" id="cfEmail" value="'+esc((sc.admin&&sc.admin.email)||'admin@neter.com')+'"></div>'+
          '<div class="form-field"><label>Senha</label><input class="inp" id="cfPass" type="password" value="'+esc((sc.admin&&sc.admin.password)||'')+'"></div>'+
        '</div>'+
        '<button class="btn btn-gold btn-sm" onclick="saveConfig()"><i class="ti ti-check"></i> Salvar</button>'+
      '</div>'+
      '<div class="section">'+
        '<div class="section-title">Status da Conexão</div>'+
        '<div style="display:flex;align-items:center;gap:10px;font-size:13px">'+
          '<div style="width:10px;height:10px;border-radius:50%;background:'+(SB_ONLINE?'#6ab87a':'var(--red)')+'"></div>'+
          (SB_ONLINE?'Supabase conectado':'Verificando...')+
        '</div>'+
      '</div>'+
    '</div>';
}
function saveConfig(){
  if(!window.siteConfig) window.siteConfig={};
  window.siteConfig.admin={email:$('cfEmail').value,password:$('cfPass').value};
  try{ localStorage.setItem('soul_admin_config',JSON.stringify({admin:window.siteConfig.admin})); }catch(e){}
  toast('Credenciais salvas localmente.');
}

/* ══════════════════ MOBILE NAV ══════════════════ */
function openMobMenu(){
  var d=$('mobDrawer'),o=$('mobOverlay'); if(d) d.classList.add('open'); if(o) o.classList.add('open');
}
function closeMobMenu(){
  var d=$('mobDrawer'),o=$('mobOverlay'); if(d) d.classList.remove('open'); if(o) o.classList.remove('open');
}

/* ══════════════════ INIT ══════════════════ */
(function(){
  var style=document.createElement('style');
  style.textContent='@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}';
  document.head.appendChild(style);
  var s; try{ s=sessionStorage.getItem('soul_admin_session'); }catch(e){}
  if(s){ AD_USER={email:'admin'}; showApp(); }
})();
