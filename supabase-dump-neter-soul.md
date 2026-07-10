# Dump Supabase — Neter Soul (projeto tfrnbljrxivacubnexeh / "Soul")

> Gerado via Supabase MCP em 10/07/2026. Anexar junto com o prompt de
> diagnóstico do Neter Soul. Contém achados de segurança priorizados + schema.

---

## PARTE 0 — ACHADOS CRÍTICOS (ler antes de tudo)

### CRÍTICO 1 — RLS DESLIGADO em 15 tabelas (com políticas já existentes!)
As políticas de RLS FORAM criadas, mas o RLS está DESABILITADO nas tabelas.
Enquanto o interruptor estiver desligado, as políticas não têm efeito e
qualquer pessoa com a chave `anon` (pública, visível no front) lê e altera
todas as linhas via API REST.

Tabelas afetadas (nível ERROR, `rls_disabled_in_public` / `policy_exists_rls_disabled`):
user_credits, credit_transactions, sessions, anna_conversations,
systemic_analysis, systemic_analyses, reports, chat_sessions, chat_messages,
therapist_clients, therapist_sessions, therapist_notes, therapist_goals,
therapist_reports, platform_messages.

Conteúdo exposto: conversas terapêuticas com a Anna, mensagens de chat,
análises sistêmicas, prontuários de clientes (nome, nascimento, telefone,
queixa principal, notas confidenciais), saldo e histórico de créditos,
mensagens de contato com nome/e-mail.

Correção (curta, mas NÃO auto-aplicada — testar o site depois de cada ativação):
como as políticas já existem, na maioria dos casos basta reativar o RLS. O
Supabase forneceu este SQL de reativação:

    ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.anna_conversations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.systemic_analysis ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.systemic_analyses ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.therapist_clients ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.therapist_sessions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.therapist_notes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.therapist_goals ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.therapist_reports ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.platform_messages ENABLE ROW LEVEL SECURITY;

ATENÇÃO: chat_sessions e chat_messages NÃO têm políticas listadas — ativar RLS
nelas sem criar política vai bloquear todo acesso. Precisam de política
"cada usuário vê as próprias linhas" antes/junto da ativação.

### CRÍTICO 2 — Créditos manipuláveis pelo cliente
Funções `add_user_credits(...)` e `debit_user_credits(...)` são SECURITY
DEFINER e executáveis pelos papéis `anon` E `authenticated` via
`/rest/v1/rpc/...`. Combinado com `user_credits` sem RLS, isso permite que um
usuário credite saldo a si mesmo por chamada direta à API. Além disso
`user_credits` tem políticas suspeitas `anon_insert_credits` e
`anon_read_credits`. Verificar: crédito só deveria ser alterado no servidor,
após confirmação de pagamento (webhook Mercado Pago), nunca por RPC pública.
Revogar EXECUTE de anon/authenticated e mover para função protegida server-side.

### CRÍTICO 3 — Criação de perfil / possível escalonamento a admin
`profiles` tem políticas de INSERT com `WITH CHECK (true)`
(`Insert perfil livre` e `anon_insert` para anon/authenticated). O campo
`role` (client | therapist | admin) está na própria tabela `profiles`.
Verificar se é possível inserir ou atualizar um perfil com `role='admin'`
a partir do cliente — se sim, é escalonamento de privilégio direto.

### ALTO — View admin com SECURITY DEFINER
View `public.admin_client_overview` é SECURITY DEFINER: roda com as permissões
do criador, ignorando RLS de quem consulta. Confirmar quem pode consultá-la.

### MÉDIO — Higiene
- 8 tabelas com RLS ligado mas SEM política (bloqueadas): anna_session_log,
  journey_reports, platform_config, prosas, prosas_indicadas, therapy_sessions,
  vouchers — confirmar se são usadas pelo front (se sim, estão quebrando).
- 11 funções com search_path mutável (add/debit_user_credits, handle_new_user,
  current_profile, current_role_, etc.).
- 3 tabelas com "sensitive columns exposed" (session_id sem RLS).
- Proteção contra senha vazada (HaveIBeenPwned) desativada no Auth.
- Duas gerações de tabelas coexistem: systemic_analysis vs systemic_analyses,
  e sessions vs chat_sessions/chat_messages. Confirmar qual está ativa.

---

## PARTE 1 — Tabelas (schema public)

Legenda RLS: [ON]=habilitado / [OFF]=DESABILITADO.

- **profiles** [ON] (10 linhas) — id (PK), auth_user_id (FK→auth.users),
  name, email (unique), role (check: client/therapist/admin, default client),
  phone, avatar_url, credits, soul_journey_unlocked, plan, plan_billing,
  plan_status, plan_mp_payment_id, premium_consulta_total/usada, intention,
  timestamps. ⚠ INSERT policy WITH CHECK(true).
- **settings** [ON] (3) — key (unique), value jsonb. Leitura pública, escrita admin.
- **credit_packages** [ON] (4) — name, credits, price_cents, currency, is_active.
- **user_credits** [OFF] (10) — user_id (unique, FK→profiles), balance. ⚠ créditos.
- **credit_transactions** [OFF] (5) — user_id, type (purchase/session_usage/
  refund/admin_adjustment/store_purchase), amount, reference_type/id. ⚠ créditos.
- **products** [ON] (0) — loja SOUL: title, slug, type (audio/ebook/induction),
  price_credits, price_cents, status, file_url.
- **therapists** [ON] (0) — name, specialty, professional_register, price_credits.
- **sessions** [OFF] (0) — ⚠ histórico terapêutico. user_id, therapist_id,
  type (anna_ai/human_therapist/systemic_analysis/professional_tool), notes,
  summary, credits_used.
- **anna_conversations** [OFF] (0) — ⚠ conversas. user_id, session_id,
  messages jsonb, summary, credits_used.
- **systemic_analysis** [OFF] (4) — user_id, answers jsonb, result jsonb, status.
- **reports** [OFF] (0) — user_id, session_id, type (therapeutic/systemic/
  graphological/ericksonian_induction/session_summary), content.
- **pro_tools** [ON] (6) — number (unique), title, route, status.
- **user_purchases** [ON] (0) — user_id, product_id, credits_used, status.
- **chat_sessions** [OFF] (0) — user_id, credits_used, message_count. ⚠ sem política.
- **chat_messages** [OFF] (0) — session_id, user_id, role (user/assistant/
  system), content, credits_used. ⚠ sem política.
- **systemic_analyses** [OFF] (0) — user_id, answers jsonb, report_json,
  report_text, credits_used (default 30), status.
- **therapy_sessions** [ON, sem política] (0) — client_id, client_name,
  transcript, analysis jsonb, audio_name. ⚠ transcrição.
- **therapist_clients** [OFF] (0) — ⚠ prontuário: therapist_id, linked_user_id,
  full_name, birth_date, phone, email, city, profession, marital_status,
  main_complaint, previous_therapy_history, important_notes, status, tags.
- **therapist_sessions** [OFF] (0) — ⚠ notas clínicas: worked_theme,
  client_speeches, techniques_used, interventions, confidential_notes,
  níveis 0-10 (anxiety/clarity/self_esteem/energy/adherence/general_progress).
- **therapist_notes** [OFF] (0) — client_id, content, category.
- **therapist_goals** [OFF] (0) — client_id, title, deadline, status, progress.
- **therapist_reports** [OFF] (0) — client_id, content, pdf_url.
- **platform_config** [ON, sem política] (1) — key (PK), value jsonb.
- **platform_messages** [OFF] (1) — name, email, subject, message. ⚠ contato.
- **vouchers** [ON, sem política] (7) — code (unique), type (percent/fixed/free),
  value, plan_target, duration_days, uses_max, uses_count, active.
- **emotion_checkins** [ON] (0) — user_id, checkin_date, val (1-5), emoji, note.
- **journey_reports** [ON, sem política] (0) — user_id, cycle_start/end,
  data jsonb, sessions_count, checkins_count, shared_with_therapist.
- **prosas** [ON, sem política] (50) — slug (unique), titulo, storage_path,
  duracao_min, tags_* (dor/momento/arquetipo/intencao/mecanismo/origem), active.
- **prosas_indicadas** [ON, sem política] (0) — user_id, prosa_id,
  padrao_dominante, motivo, avaliacao (1-5), feedback.
- **anna_session_log** [ON, sem política] (3) — user_id, started_at,
  last_msg_at, msg_count.

Funções relevantes: add_user_credits, debit_user_credits (⚠ créditos, RPC
pública), current_profile, current_role_, handle_new_user, increment_voucher_use,
set_updated_at, update_updated_at(_column).
View: admin_client_overview (⚠ SECURITY DEFINER).
