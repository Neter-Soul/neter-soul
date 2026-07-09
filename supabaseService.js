/* ═══════════════════════════════════════════════════════════════════════
   supabaseService.js — serviços de dados (leitura e escrita)
   Funciona em modo DUAL:
     • sb disponível → usa Supabase
     • sb === null   → usa siteConfig + localStorage (fallback)
   Incluir DEPOIS de supabaseClient.js e siteConfig.js.
   ═══════════════════════════════════════════════════════════════════════ */

var SoulDB = {

  // ─── SITE CONFIG: carrega tudo necessário para o site funcionar ─────
  // [futuro: substitui a leitura do siteConfig.js]
  loadSiteConfig: async function(){
    if(!window.sb) {
      // fallback: usa siteConfig (já carregado + overrides do Admin)
      console.info("[SoulDB] loadSiteConfig → fallback local");
      return window.siteConfig || {};
    }
    try {
      var rows = await window.sb.from('settings').select('key,value');
      if(rows.error) throw rows.error;
      var merged = Object.assign({}, window.siteConfig||{});
      (rows.data||[]).forEach(function(r){ merged[r.key] = r.value; });
      // merge em window.siteConfig para que o restante do site use
      window.siteConfig = merged;
      console.info("[SoulDB] loadSiteConfig → Supabase ✓ ("+rows.data.length+" chaves)");
      return merged;
    } catch(e) {
      console.warn("[SoulDB] loadSiteConfig erro Supabase, usando fallback:", e.message);
      return window.siteConfig || {};
    }
  },

  // ─── PRODUCTS ────────────────────────────────────────────────────────
  getProducts: async function(type){
    if(!window.sb) return type==='ebook'?(window.siteConfig||{}).lojaEbooks||[]
                                        :(window.siteConfig||{}).lojaAudios||[];
    try {
      var q = window.sb.from('products').select('*').eq('status','available');
      if(type) q = q.eq('type',type);
      var {data,error} = await q;
      if(error) throw error;
      return data;
    } catch(e){
      console.warn("[SoulDB] getProducts fallback:", e.message);
      return type==='ebook'?(window.siteConfig||{}).lojaEbooks||[]
                            :(window.siteConfig||{}).lojaAudios||[];
    }
  },

  // ─── THERAPISTS ──────────────────────────────────────────────────────
  getTherapists: async function(){
    if(!window.sb) return (window.siteConfig||{}).therapists||[];
    try {
      var {data,error} = await window.sb.from('therapists').select('*').eq('status','active');
      if(error) throw error;
      return data;
    } catch(e){
      console.warn("[SoulDB] getTherapists fallback:", e.message);
      return (window.siteConfig||{}).therapists||[];
    }
  },

  // ─── CREDIT PACKAGES ─────────────────────────────────────────────────
  getCreditPackages: async function(){
    if(!window.sb) return (window.siteConfig||{}).credits&&(window.siteConfig||{}).credits.packages||[];
    try {
      var {data,error} = await window.sb.from('credit_packages').select('*').eq('is_active',true);
      if(error) throw error;
      return data;
    } catch(e){
      console.warn("[SoulDB] getCreditPackages fallback:", e.message);
      return (window.siteConfig||{}).credits&&(window.siteConfig||{}).credits.packages||[];
    }
  },

  // ─── PRO TOOLS ───────────────────────────────────────────────────────
  getProTools: async function(){
    if(!window.sb) return (window.siteConfig||{}).proTools||[];
    try {
      var {data,error} = await window.sb.from('pro_tools').select('*').order('number');
      if(error) throw error;
      return data;
    } catch(e){
      console.warn("[SoulDB] getProTools fallback:", e.message);
      return (window.siteConfig||{}).proTools||[];
    }
  },

  // ─── AUTH — LOGIN ADMIN ───────────────────────────────────────────────
  // [futuro: substitui o login temporário de admin.js]
  adminLogin: async function(email, password){
    if(!window.sb) return {error: 'SUPABASE_NOT_CONFIGURED'};
    try {
      var {data, error} = await window.sb.auth.signInWithPassword({email,password});
      if(error) return {error: error.message};
      // verifica se é admin
      var {data:profile, error:pErr} = await window.sb
        .from('profiles').select('role').eq('auth_user_id',data.user.id).single();
      if(pErr || !profile) return {error: 'Perfil não encontrado.'};
      if(profile.role !== 'admin') return {error: 'Acesso não autorizado.'};
      return {ok:true, user:data.user, role:profile.role};
    } catch(e){ return {error: e.message}; }
  },

  adminLogout: async function(){
    if(window.sb) await window.sb.auth.signOut().catch(function(){});
  },

  // ─── SETTINGS (Admin: salvar) ─────────────────────────────────────────
  // [futuro: substitui localStorage.setItem('soul_admin_config',...) do admin.js]
  saveSettings: async function(key, value){
    if(!window.sb) {
      // fallback local
      var saved = {};
      try{ saved = JSON.parse(localStorage.getItem('soul_admin_config'))||{}; }catch(e){}
      saved[key] = value;
      localStorage.setItem('soul_admin_config', JSON.stringify(saved));
      return {ok:true, local:true};
    }
    try {
      var {error} = await window.sb.from('settings').upsert({key,value},{onConflict:'key'});
      if(error) throw error;
      return {ok:true, supabase:true};
    } catch(e){ return {error:e.message}; }
  },

  // ─── UPSERT genérico (Admin: produtos, terapeutas etc.) ──────────────
  upsert: async function(table, row){
    if(!window.sb) return {error:'SUPABASE_NOT_CONFIGURED'};
    try {
      var {data,error} = await window.sb.from(table).upsert(row).select();
      if(error) throw error;
      return {ok:true, data};
    } catch(e){ return {error:e.message}; }
  },

  delete: async function(table, id){
    if(!window.sb) return {error:'SUPABASE_NOT_CONFIGURED'};
    try {
      var {error} = await window.sb.from(table).delete().eq('id',id);
      if(error) throw error;
      return {ok:true};
    } catch(e){ return {error:e.message}; }
  },

  // ─── SESSÕES (site) ───────────────────────────────────────────────────
  // [futuro: salvar sessões reais quando Anna estiver com IA]
  saveSession: async function(session){
    if(!window.sb) return {ok:true, local:true}; // sessões locais ficam em CU.sessions
    try {
      var {data,error} = await window.sb.from('sessions').insert(session).select();
      if(error) throw error;
      return {ok:true, data};
    } catch(e){ return {error:e.message}; }
  }
};

// expõe globalmente
window.SoulDB = SoulDB;

// ═══════════════════════════════════════════════════════════════════════
// CRÉDITOS SOUL — funções de saldo, débito, crédito e histórico
// ⚠️  MVP: débitos críticos usam RPC (SECURITY DEFINER no Supabase).
//    Em modo local, créditos ficam em CU.credits + localStorage.
// ═══════════════════════════════════════════════════════════════════════

/* ─── helpers locais ─────────────────────────────────────────────────── */
function _localBalance(){ return window.CU?(window.CU.credits||0):0; }
function _setLocalBalance(n){ if(window.CU){ window.CU.credits=n; if(typeof saveCU==='function') saveCU(); } }
function _addLocalTx(type, amount, desc){
  var tx = JSON.parse(localStorage.getItem('soul_credit_tx')||'[]');
  tx.push({type,amount,desc,date:new Date().toISOString(),balance:_localBalance()});
  if(tx.length>200) tx=tx.slice(-200);
  localStorage.setItem('soul_credit_tx', JSON.stringify(tx));
}

/* ─── getUserCredits ─────────────────────────────────────────────────── */
SoulDB.getUserCredits = async function(profileId){
  if(!window.sb || !profileId) return {balance: _localBalance(), local:true};
  try{
    var {data,error} = await window.sb.from('user_credits').select('balance').eq('user_id',profileId).single();
    if(error) throw error;
    return {balance: data.balance};
  }catch(e){
    console.warn('[SoulDB] getUserCredits fallback:', e.message);
    return {balance: _localBalance(), local:true};
  }
};

/* ─── hasEnoughCredits ───────────────────────────────────────────────── */
SoulDB.hasEnoughCredits = async function(profileId, amount){
  var res = await SoulDB.getUserCredits(profileId);
  return res.balance >= amount;
};

/* ─── debitCredits (usa RPC segura) ─────────────────────────────────── */
SoulDB.debitCredits = async function(profileId, amount, description, refType, refId){
  // ── Supabase: RPC atomic ──
  if(window.sb && profileId){
    try{
      var {data,error} = await window.sb.rpc('debit_user_credits',{
        p_user_id:        profileId,
        p_amount:         amount,
        p_description:    description||'',
        p_reference_type: refType||'',
        p_reference_id:   refId||null
      });
      if(error) throw error;
      var result = data;
      if(!result.ok) return {ok:false, error:result.error, balance:result.balance};
      // sync local display
      _setLocalBalance(result.new_balance);
      return {ok:true, new_balance:result.new_balance};
    }catch(e){
      console.warn('[SoulDB] debitCredits RPC erro, usando fallback local:', e.message);
    }
  }
  // ── Fallback local ──
  var bal = _localBalance();
  if(bal < amount) return {ok:false, error:'Saldo insuficiente.', balance:bal};
  var newBal = bal - amount;
  _setLocalBalance(newBal);
  _addLocalTx('session_usage', -amount, description||'');
  return {ok:true, new_balance:newBal, local:true};
};

/* ─── addCredits ─────────────────────────────────────────────────────── */
SoulDB.addCredits = async function(profileId, amount, description, type, refType, refId){
  if(window.sb && profileId){
    try{
      var {data,error} = await window.sb.rpc('add_user_credits',{
        p_user_id:        profileId,
        p_amount:         amount,
        p_description:    description||'',
        p_type:           type||'purchase',
        p_reference_type: refType||'',
        p_reference_id:   refId||null
      });
      if(error) throw error;
      _setLocalBalance(data.new_balance);
      return {ok:true, new_balance:data.new_balance};
    }catch(e){
      console.warn('[SoulDB] addCredits fallback:', e.message);
    }
  }
  var newBal = _localBalance() + amount;
  _setLocalBalance(newBal);
  _addLocalTx(type||'purchase', amount, description||'');
  return {ok:true, new_balance:newBal, local:true};
};

/* ─── adminAdjustCredits ─────────────────────────────────────────────── */
SoulDB.adminAdjustCredits = async function(profileId, amount, description){
  if(!window.sb) return {ok:false, error:'Supabase não configurado.'};
  try{
    var {data,error} = await window.sb.rpc('admin_adjust_credits',{
      p_user_id:    profileId,
      p_amount:     amount,
      p_description: description||'Ajuste administrativo'
    });
    if(error) throw error;
    return data;
  }catch(e){ return {ok:false, error:e.message}; }
};

/* ─── getCreditTransactions ──────────────────────────────────────────── */
SoulDB.getCreditTransactions = async function(profileId){
  if(window.sb && profileId){
    try{
      var {data,error} = await window.sb.from('credit_transactions')
        .select('*').eq('user_id',profileId)
        .order('created_at',{ascending:false}).limit(50);
      if(error) throw error;
      return data;
    }catch(e){ console.warn('[SoulDB] getCreditTransactions fallback:', e.message); }
  }
  return JSON.parse(localStorage.getItem('soul_credit_tx')||'[]').reverse();
};

/* ─── completeAnnaSession ────────────────────────────────────────────── */
SoulDB.completeAnnaSession = async function(sessionData){
  // sessionData: {profileId, duration, credits, summary, messages}
  var pid = sessionData.profileId;
  var desc = 'Sessão com Anna Goldi — ' + sessionData.duration + ' minutos';

  // 1. debitar créditos
  var debit = await SoulDB.debitCredits(pid, sessionData.credits, desc, 'anna_session');
  if(!debit.ok) return debit;

  // 2. salvar sessão no Supabase
  if(window.sb && pid){
    try{
      var sRes = await window.sb.from('sessions').insert({
        user_id:          pid,
        type:             'anna_ai',
        duration_minutes: sessionData.duration,
        credits_used:     sessionData.credits,
        title:            'Sessão com Anna Goldi',
        summary:          sessionData.summary||'',
        started_at:       sessionData.startedAt||new Date().toISOString(),
        ended_at:         new Date().toISOString()
      }).select().single();
      if(!sRes.error && sRes.data){
        // salvar conversa
        await window.sb.from('anna_conversations').insert({
          user_id:      pid,
          session_id:   sRes.data.id,
          messages:     sessionData.messages||[],
          summary:      sessionData.summary||'',
          credits_used: sessionData.credits
        });
      }
    }catch(e){ console.warn('[SoulDB] completeAnnaSession save:', e.message); }
  }

  // 3. salvar localmente (independente do Supabase)
  if(window.CU){
    var sess = {
      id: Date.now(),
      type:'anna',
      date: new Date().toLocaleDateString('pt-BR'),
      dur: sessionData.duration,
      title: 'Sessão com Anna Goldi',
      summary: sessionData.summary||''
    };
    window.CU.sessions = window.CU.sessions||[];
    window.CU.sessions.push(sess);
    if(typeof saveCU==='function') saveCU();
  }

  return {ok:true, new_balance:debit.new_balance};
};

/* ─── completeSystemicAnalysis ───────────────────────────────────────── */
SoulDB.completeSystemicAnalysis = async function(analysisData){
  var pid     = analysisData.profileId;
  var COST    = 4; // créditos
  var desc    = 'Geração de Análise Sistêmica';

  var debit = await SoulDB.debitCredits(pid, COST, desc, 'systemic_analysis');
  if(!debit.ok) return debit;

  if(window.sb && pid){
    try{
      await window.sb.from('systemic_analysis').insert({
        user_id: pid,
        answers: analysisData.answers||{},
        result:  analysisData.result||{},
        status:  'completed'
      });
    }catch(e){ console.warn('[SoulDB] completeSystemicAnalysis save:', e.message); }
  }

  return {ok:true, new_balance:debit.new_balance};
};

/* ─── purchaseProduct ────────────────────────────────────────────────── */
SoulDB.purchaseProduct = async function(purchaseData){
  // purchaseData: {profileId, productId, productSlug, productTitle, price}
  var pid  = purchaseData.profileId;
  var desc = 'Loja SOUL — ' + (purchaseData.productTitle||purchaseData.productSlug||'Produto');

  var debit = await SoulDB.debitCredits(pid, purchaseData.price, desc, 'store_purchase', purchaseData.productId||null);
  if(!debit.ok) return debit;

  if(window.sb && pid){
    try{
      await window.sb.from('user_purchases').insert({
        user_id:       pid,
        product_id:    purchaseData.productId||null,
        product_slug:  purchaseData.productSlug||'',
        product_title: purchaseData.productTitle||'',
        credits_used:  purchaseData.price,
        status:        'completed'
      });
    }catch(e){ console.warn('[SoulDB] purchaseProduct save:', e.message); }
  }

  // salvar compra local
  if(window.CU){
    var purchases = JSON.parse(localStorage.getItem('soul_purchases_'+window.CU.name)||'[]');
    purchases.push({slug:purchaseData.productSlug,title:purchaseData.productTitle,date:new Date().toISOString()});
    localStorage.setItem('soul_purchases_'+window.CU.name, JSON.stringify(purchases));
  }

  return {ok:true, new_balance:debit.new_balance};
};

/* ─── getProfileId ───────────────────────────────────────────────────── */
// Retorna o ID do perfil Supabase do usuário atual (ou null em modo local).
SoulDB.getProfileId = async function(){
  // 1. CU.supabase_id — definido no cadastro (caminho principal)
  if(window.CU && window.CU.supabase_id) return window.CU.supabase_id;
  // 2. busca por e-mail no Supabase (usuários migrados sem supabase_id)
  if(window.sb && window.CU && window.CU.email){
    try{
      var {data,error} = await window.sb.from('profiles').select('id').eq('email',window.CU.email).single();
      if(!error && data){
        // cacheia para não repetir a busca
        window.CU.supabase_id = data.id;
        if(typeof saveCU==='function') saveCU();
        return data.id;
      }
    }catch(e){}
  }
  return null;
};

/* ─── refreshUIBalance ───────────────────────────────────────────────── */
// Atualiza TODOS os pontos de saldo na interface.
SoulDB.refreshUIBalance = async function(){
  var pid = await SoulDB.getProfileId();
  var res = await SoulDB.getUserCredits(pid);
  var bal = res.balance;

  // sync CU.credits
  if(window.CU){ window.CU.credits = bal; if(typeof saveCU==='function') saveCU(); }

  // update UI elements
  var ids = ['hCredits','acbBalance','ljCredits','tmBalVal','acbBalAmt'];
  ids.forEach(function(id){
    var el=document.getElementById(id);
    if(el) el.textContent=bal;
  });
  // anna credit bar
  if(typeof annaUpdateCreditBar==='function') annaUpdateCreditBar();
  return bal;
};
