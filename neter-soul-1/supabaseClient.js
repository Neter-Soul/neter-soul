/* supabaseClient.js — NETER/SOUL */
var SUPABASE_URL      = "https://tfrnbljrxivacubnexeh.supabase.co";
var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmcm5ibGpyeGl2YWN1Ym5leGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDE0MzQsImV4cCI6MjA5NTkxNzQzNH0.jt1603Yn9qM7A3sS9SwODzAygfTvNvK7Hm9E_rRCedw";

window.supabaseConfigured = true;

var _sbScript = document.createElement('script');
_sbScript.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
_sbScript.onload = function(){
  window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  // ponte para o módulo AC que usa window.supabase
  window.supabase = window.sb;
  console.info("[SOUL] Supabase conectado ✓");
  window.dispatchEvent(new Event('supabaseReady'));
};
_sbScript.onerror = function(){
  console.warn("[SOUL] CDN falhou — usando REST direto");
  // fallback REST sem CDN
  window.sb = _makeRestClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.supabase = window.sb;
  window.supabaseConfigured = true;
  window.dispatchEvent(new Event('supabaseReady'));
};
document.head.appendChild(_sbScript);

function _makeRestClient(url, key){
  var H={'apikey':key,'Authorization':'Bearer '+key,'Content-Type':'application/json','Prefer':'return=representation'};
  function req(method,table,filters,body){
    var qs=(filters&&filters.length)?filters.join('&'):'select=*';
    return fetch(url+'/rest/v1/'+table+'?'+qs,{method:method,headers:H,body:body?JSON.stringify(body):undefined})
      .then(function(r){
        if(r.status===204)return{data:[],error:null};
        return r.text().then(function(t){
          var d;try{d=JSON.parse(t);}catch(e){d=t;}
          if(!r.ok)return{data:null,error:{message:(d&&d.message)||String(t).slice(0,100)}};
          return{data:Array.isArray(d)?d:[d],error:null};
        });
      }).catch(function(e){return{data:null,error:{message:e.message}};});
  }
  function from(table){
    var _f=['select=*'];
    var q={
      select:function(s){_f=['select='+s];return q;},
      eq:function(c,v){_f.push(c+'=eq.'+encodeURIComponent(v));return q;},
      order:function(c,o){_f.push('order='+c+(o&&o.ascending===false?'.desc':'.asc'));return q;},
      limit:function(n){_f.push('limit='+n);return q;},
      single:function(){return q.then(function(r){return{data:r.data&&r.data[0]||null,error:r.error};});},
      insert:function(rows){var r=Array.isArray(rows)?rows:[rows];var ret={then:function(fn){return req('POST',table,['select=*'],r).then(fn);}};ret.select=function(){return ret;};return ret;},
      upsert:function(rows,opts){var r=Array.isArray(rows)?rows:[rows];var ret={then:function(fn){return req('POST',table,['select=*'],r).then(fn);}};ret.select=function(){return ret;};return ret;},
      update:function(data){return{eq:function(c,v){var ret={then:function(fn){return req('PATCH',table,['select=*',c+'=eq.'+encodeURIComponent(v)],data).then(fn);}};ret.select=function(){return ret;};return ret;}};},
      delete:function(){return{eq:function(c,v){return{then:function(fn){return req('DELETE',table,[c+'=eq.'+encodeURIComponent(v)]).then(fn);}};},then:function(fn){return req('DELETE',table,_f).then(fn);}};},
      then:function(fn){return req('GET',table,_f).then(fn);}
    };
    return q;
  }
  function rpc(fn,params){
    return fetch(url+'/rest/v1/rpc/'+fn,{method:'POST',headers:H,body:JSON.stringify(params||{})})
      .then(function(r){return r.json().then(function(d){return r.ok?{data:d,error:null}:{data:null,error:{message:d.message||r.statusText}};});})
      .catch(function(e){return{data:null,error:{message:e.message}};});
  }
  return{
    from:from,rpc:rpc,
    auth:{
      getUser:function(){return Promise.resolve({data:{user:null},error:null});},
      getSession:function(){return Promise.resolve({data:{session:null},error:null});},
      signInWithPassword:function(){return Promise.resolve({data:null,error:{message:'Auth não disponível'}});},
      signOut:function(){return Promise.resolve({error:null});}
    }
  };
}
