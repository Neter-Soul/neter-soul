# Remediação 01 — remover Functions `service_role` sem auth

**Objetivo:** estancar o pior vazamento (prontuário exfiltrável de qualquer origem) removendo três arquivos que rodam com `SUPABASE_SERVICE_ROLE_KEY` sem nenhuma trava de acesso.

**Risco de quebrar o site:** nenhum.
- `admin-data.js` → não é referenciada em nenhum lugar do app (código morto deployado).
- `migrate-users.js` → só é usada por `migrar.html` (ferramenta de uso único).
- O painel admin **continua funcionando**: `admin.js` lê via REST `anon` direto, não usa essas Functions.

---

## 1. Parada imediata (antes até do git)

No painel do Netlify, o jeito mais rápido de tirar do ar agora é redeployar sem os arquivos (passo 2). Se quiser cortar antes disso: renomeie os dois `.js` para `.js.off` localmente e rode um `netlify deploy --prod` — o Netlify deixa de reconhecê-los como Function. Mas o passo 2 já resolve de forma definitiva.

---

## 2. Remoção permanente (Git Bash)

> Ajuste o caminho do repositório e o diretório das Functions se forem diferentes.
> Assumi `netlify/functions/`. Confirme com `ls netlify/functions/`.

```
cd "/c/Users/Lenovo/Desktop/NETER Master"
```
```
ls netlify/functions/
```
```
git rm netlify/functions/admin-data.js
```
```
git rm netlify/functions/migrate-users.js
```
```
git rm migrar.html
```
```
git add -A
```
```
git commit -m "security: remove Functions service_role sem auth (admin-data, migrate-users) e migrar.html"
```
```
git push
```

## 3. Publicar (deploy CLI do Neter Soul)

```
netlify deploy --prod --no-build --dir .
```

## 4. Verificar que morreram (deve retornar 404)

```
curl -s -o /dev/null -w "admin-data: %{http_code}\n" "https://netersoul.com.br/.netlify/functions/admin-data?resource=profiles&select=*"
```
```
curl -s -o /dev/null -w "migrate-users: %{http_code}\n" -X POST "https://netersoul.com.br/.netlify/functions/migrate-users" -H "Content-Type: application/json" -d "[]"
```
```
curl -s -o /dev/null -w "migrar.html: %{http_code}\n" "https://netersoul.com.br/migrar.html"
```
Esperado: `404` nas três. Se vier `200`, o deploy não pegou o diretório certo de Functions.

## 5. Confirmar alinhamento

```
git log --oneline -3
```

---

## Ressalva — migração ainda não concluída?

Removi `migrate-users.js` + `migrar.html` assumindo que a migração dos usuários locais (`sn5_users`) **já foi feita**. Se ainda faltam usuários pra migrar, me avisa: eu te entrego uma versão de uso único, protegida por um segredo em variável de ambiente e sem CORS aberto, pra você rodar uma vez e apagar. Tirar a versão pública do ar é o certo de qualquer jeito — a migração é recuperável, o vazamento não.

## Sobre `admin-data.js` — não é desperdício

Removi agora porque está aberta e sem uso. Mas o *padrão* dela (uma Function server-side que serve dados de admin) é o caminho certo pro futuro: quando você religar o RLS, o painel admin vai parar de ler via `anon` e vai precisar exatamente de uma Function assim — só que com validação de admin no servidor, allowlist de origem e allowlist de `resource` (nunca tabela arbitrária). Quando chegarmos na auth real, eu reconstruo essa versão segura.
