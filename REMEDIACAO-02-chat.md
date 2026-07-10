# Remediação 02 — `chat.js` à prova de cliente + modos da Anna companheira ligados

## O que mudou

**Segurança (`netlify/functions/chat.js`)**
1. **O system prompt agora é montado 100% no servidor.** O campo `_sys` que o cliente enviava foi **ignorado por completo** — o cliente não consegue mais injetar nem sobrescrever as instruções da Anna. Antes, o `buildSys` do cliente substituía o prompt inteiro; agora o servidor decide, a partir de um `variant` + dados de perfil.
2. **Teto rígido de tokens** (`ANNA_TOKENS_CAP = 1000`). Preserva os 600/700/800 atuais e barra abuso de custo acima disso. O cliente não escolhe mais tokens livremente.
3. **CORS por allowlist** em vez de `*`. Só `netersoul.com.br` (e `www.`) por padrão. Isso barra outros **sites** de embutir seu endpoint no navegador. **Não** substitui autenticação — `curl`/servidor ignoram CORS; a trava real vem com a auth (remediação futura).

**Bug corrigido (`index.html` + `chat.js`)**
4. **Os 3 modos da Anna companheira (Amorosa/Reflexiva/Sistêmica) agora funcionam.** Antes, o `acSend` montava o prompt do modo + relatório + memória e **jogava fora** (a variável `sys` nunca era enviada). A Anna companheira rodava sempre no prompt genérico. Agora o cliente manda `mode` + `report` + `memory` como dados, e o servidor monta o prompt do modo escolhido. **Isso muda a saída da Anna companheira — para o que você projetou.**

**O fluxo de terapia continua idêntico.** O prompt "fusão de Hellinger/Jung/Erickson" foi movido pro servidor palavra por palavra (`buildTherapySystem`). Mesma saída, agora inviolável.

## O que NÃO mudou (de propósito — é a opção "b", adiada)
O prompt do fluxo de terapia **continua sem o protocolo de crise completo** (você escolheu manter o comportamento idêntico). O protocolo de crise segue ativo na Anna companheira e na intervenção hipnótica (`tHypno`), que usam o `ANNA_SYSTEM` do servidor. Quando quiser, a Remediação 03 injeta o núcleo de crise também no fluxo de terapia — é pequena.

## Também não tocado nesta rodada
`systemic_analysis` continua chamando Opus sem auth (só o `type` server-side). A trava real desse endpoint depende de autenticação. Fica pra depois.

---

## Arquivos

Substitua no repo (mesmos caminhos):
- `netlify/functions/chat.js`
- `index.html`

Ambos já validados com `node --check` (o JS inline do `index.html` também parseia).

## Deploy (Git Bash)

```
cd "/c/Users/lucca/OneDrive/Desktop/neter-soul-main/neter-soul-1"
```
```
git add -A
```
```
git commit -m "security(chat): system prompt server-side, ignora _sys do cliente, teto de tokens, CORS allowlist; liga modos da Anna companheira"
```
```
git push
```

O site é git-conectado (Deploys from GitHub), então o push dispara o deploy. Aguarde ~1-2 min.

```
git log --oneline -3
```

## Checklist de teste (importante — a Anna companheira mudou)

No navegador / Android, pelo domínio de produção:

1. **Terapia:** faça uma Análise Sistêmica → entre na sessão → confirme que a Anna responde **como antes** (idêntico). Se mudou, me avisa.
2. **Companheira — os 3 modos:** abra a Anna companheira e teste **Amorosa**, depois **Reflexiva**, depois **Sistêmica**. Agora o tom deve ser **claramente diferente** entre eles (antes eram iguais). Esse é o comportamento novo e esperado.
3. **Personalização:** confirme que a Anna companheira faz referências ao seu mapa (ferida, padrão sistêmico) sem dizer "relatório/análise".
4. **Console:** abra o DevTools e confirme que **não** há erro de CORS vindo de `netersoul.com.br`.

## Se você testar pelo preview `.netlify.app` ou localhost
O CORS vai **bloquear**, porque só liberei o domínio de produção. No topo do `chat.js` há um bloco `ALLOWED_ORIGINS` com duas linhas comentadas — descomente a do preview (ajuste o subdomínio real) ou a do localhost e faça deploy. Em produção (`netersoul.com.br`) funciona direto.

## Nota
Deixei um comentário no `index.html` onde ficava o `_ANNA_MODE_PROMPTS` do cliente — removi a cópia dele porque a fonte de verdade agora é o `chat.js`. Manter duas cópias só criaria divergência futura.
