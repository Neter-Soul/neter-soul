/* ═══════════════════════════════════════════════════════════════════════
   SITE CONFIG — NETER / SOUL
   ───────────────────────────────────────────────────────────────────────
   ESTE É O ARQUIVO CENTRAL DE CONFIGURAÇÃO DO SITE.
   Aqui você edita textos, imagens, valores, créditos, produtos e contatos
   SEM precisar mexer no código do site.

   👉 Para um guia passo a passo em linguagem simples, leia: COMO_EDITAR.md

   ⚠️  FUTURO (Admin + Supabase):
   Este objeto "siteConfig" será futuramente substituído por dados vindos
   do banco de dados (Supabase). Cada bloco abaixo já indica de qual tabela
   ele virá:
     • brand/texts/ethics  → tabela "settings"
     • credits/packages    → tabela "credits"
     • loja (áudios/ebooks) → tabela "products"
     • therapists          → tabela "therapists"
     • proTools            → tabela "settings" (ou "tools")
   ═══════════════════════════════════════════════════════════════════════ */

window.siteConfig = {

  /* ─── 0. ADMIN (TEMPORÁRIO — MVP LOCAL) ──────────────────────────────
     ⚠️  ATENÇÃO: Estas credenciais são TEMPORÁRIAS e servem apenas para o
     MVP local do painel admin. NUNCA use isto como segurança real.
     [futuro: será substituído por Supabase Auth + tabela "profiles"
     com papel role='admin']. Não exponha este arquivo publicamente com
     uma senha real. */
  admin: {
    email: "admin@neter.com",
    password: "admin123"
  },

  /* ─── 1. MARCA E CONTATO ─────────────────────────────────────────────
     [futuro: tabela "settings"] */
  brand: {
    company: "NETER",
    project: "SOUL",
    tagline: "Plataforma de cuidado emocional",
    subtitle: "Cuidado emocional, autoconhecimento e transformação.",
    whatsapp: "",          // ex: "+55 11 90000-0000"
    email: "",             // ex: "contato@soul.com.br"
    instagram: "",         // ex: "@soul.neter"
    site: ""               // ex: "https://soul.com.br"
  },

  /* ─── 2. IMAGENS ─────────────────────────────────────────────────────
     Troque os caminhos abaixo pelas imagens da marca em /public/images/.
     Enquanto não houver imagem própria, os placeholders Unsplash são
     usados automaticamente (o site não quebra). */
  images: {
    logoMark:   "",  // /public/images/logo/logo.png  (vazio = usa a letra "S")
    annaGoldi:  "",  // /public/images/anna-goldi/anna.jpg (vazio = usa a foto embutida atual)
    heroCliente:"https://images.unsplash.com/photo-1499209974431-9daddef938c5?w=900&q=85&auto=format&fit=crop&crop=focalpoint",
    quotePhoto: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=200&q=80&auto=format",
    analysisHero:"https://images.unsplash.com/photo-1499209974431-9daddef938c5?w=900&q=85&auto=format&fit=crop"
  },

  /* ─── 3. CRÉDITOS SOUL E VALORES ─────────────────────────────────────
     [futuro: tabela "credits"]
     userInitialBalance = créditos que cada novo cliente recebe ao criar conta.
     1 Crédito Soul = R$ 1,00. */
  credits: {
    userInitialBalance: 500,
    creditsPerMinute: 0.1,   // 1 crédito a cada 10 min → 30min=3, 60min=6, 90min=9
    sessionDurations: [
      { minutes: 30, credits: 3, label: "30 minutos", description: "Momento terapêutico breve" },
      { minutes: 45, credits: 5, label: "45 minutos", description: "Momento terapêutico equilibrado" },
      { minutes: 60, credits: 6, label: "60 minutos", description: "Momento terapêutico completo" },
      { minutes: 90, credits: 9, label: "90 minutos", description: "Momento terapêutico aprofundado" }
    ],
    packages: [
      { name: "Essencial", credits: 200,  price: "R$200", note: "~1 sessão" },
      { name: "Jornada",   credits: 500,  price: "R$500", note: "~2 sessões", popular: true },
      { name: "Profundo",  credits: 1000, price: "R$1000", note: "~4 sessões" },
      { name: "Imersão",   credits: 2000, price: "R$2000", note: "~8 sessões" }
    ]
  },

  /* ─── 4. ANNA GOLDI ──────────────────────────────────────────────────
     [futuro: tabela "settings"] */
  annaGoldi: {
    name: "Anna Goldi",
    role: "Assistente Terapêutica · Soul",
    description: "Sua assistente terapêutica de apoio emocional, escuta guiada e organização da jornada de autoconhecimento.",
    buttonText: "Iniciar conversa terapêutica",
    ethicalNotice: "Anna Goldi é uma ferramenta complementar de apoio emocional e não substitui acompanhamento médico, psicológico ou psiquiátrico quando necessário."
  },

  /* ─── 5. FERRAMENTAS PARA TERAPEUTAS ─────────────────────────────────
     [futuro: tabela "settings"/"tools"]
     status: "disponivel" | "embreve" | "construcao"
     Ferramentas em "construcao"/"embreve" vão para a página
     "Estamos sendo criados por uma Inteligência Humana". */
  proTools: [
    { id: 0, num: "00", title: "Gerenciador de Clientes",            desc: "Organize prontuários, histórico e evolução de cada cliente em um só lugar.", icon: "ti-users",            route: "construcao", status: "construcao" },
    { id: 1, num: "01", title: "Gravação de Sessões",                desc: "Grave, transcreva e guarde suas sessões com segurança e sigilo.",            icon: "ti-microphone",       route: "construcao", status: "construcao" },
    { id: 2, num: "02", title: "Análise Sistêmica",                  desc: "Gere mapas e relatórios sistêmicos a partir das respostas do cliente.",      icon: "ti-topology-star-3",  route: "construcao", status: "construcao" },
    { id: 3, num: "03", title: "Análise Grafológica",                desc: "Ferramenta de apoio para interpretação grafológica e emocional.",            icon: "ti-signature",        route: "construcao", status: "construcao" },
    { id: 4, num: "04", title: "Gerador de Induções Ericksonianas",  desc: "Crie induções hipnóticas personalizadas no estilo ericksoniano.",            icon: "ti-wand",             route: "construcao", status: "construcao" },
    { id: 5, num: "05", title: "Relatórios",                         desc: "Relatórios terapêuticos automáticos, prontos para compartilhar.",            icon: "ti-file-text",        route: "construcao", status: "construcao" }
  ],

  /* ─── 6. TEXTOS DAS PÁGINAS ──────────────────────────────────────────
     [futuro: tabela "settings"] */
  texts: {
    entry: {
      heroEyebrow: "Plataforma de cuidado emocional",
      heroTitle: "Bem-vindo à SOUL",
      heroSubtitle: "Escolha como deseja iniciar sua experiência dentro da plataforma.",
      heroText: "A SOUL é um ambiente digital criado para apoiar jornadas terapêuticas, organizar processos emocionais e oferecer ferramentas inteligentes para clientes e terapeutas.",
      cardClienteTitle: "Iniciar Minha Jornada",
      cardClienteDesc: "Acesse sua área pessoal, acompanhe sua jornada terapêutica, utilize créditos, converse com a assistente terapêutica, encontre conteúdos de apoio e continue seu processo de autoconhecimento.",
      cardClienteBtn: "Entrar como Cliente",
      cardTerapeutaTitle: "Ferramentas para Terapeutas",
      cardTerapeutaDesc: "Acesse uma central profissional com recursos para gerenciar clientes, registrar sessões, criar análises, gerar relatórios e desenvolver materiais terapêuticos personalizados.",
      cardTerapeutaBtn: "Entrar como Terapeuta"
    },
    proArea: {
      title: "Ferramentas para Terapeutas",
      subtitle: "Uma central inteligente para organizar atendimentos, análises e relatórios terapêuticos."
    },
    loja: {
      heroTitle: "Loja SOUL",
      heroSubtitle: "Conteúdos terapêuticos digitais para apoiar sua jornada de autoconhecimento, equilíbrio emocional e transformação interior.",
      heroText: "Escolha áudios, induções hipnóticas e e-books criados para acompanhar momentos de reflexão, relaxamento, reorganização emocional e desenvolvimento pessoal."
    }
  },

  /* ─── 7. PÁGINA EM CONSTRUÇÃO ────────────────────────────────────────── */
  construction: {
    title: "Estamos sendo criados por uma Inteligência Humana",
    text: "Estamos preparando cada detalhe com tecnologia, sensibilidade e inteligência humana para entregar uma experiência segura, ética e transformadora.",
    buttonText: "Voltar"
  },

  /* ─── 8. AVISOS ÉTICOS ───────────────────────────────────────────────── */
  ethics: {
    general: "A SOUL é uma plataforma de apoio emocional, autoconhecimento e organização terapêutica. Ela não substitui atendimento médico, psicológico ou psiquiátrico quando necessário.",
    loja: "Os conteúdos da Loja SOUL são recursos complementares de apoio emocional, autoconhecimento e relaxamento. Eles não substituem acompanhamento médico, psicológico, psiquiátrico ou terapêutico individualizado quando necessário.",
    crisis: "Em situações de crise, procure ajuda profissional — CVV 188 · SAMU 192."
  },

  /* ─── 9. TERAPEUTAS HUMANOS ──────────────────────────────────────────
     [futuro: tabela "therapists"]
     Para trocar a foto, coloque o arquivo em /public/images/terapeutas/
     e use o caminho em "photo" (ex: "/public/images/terapeutas/mariana.jpg"). */
  therapists: [
    { id:1, name:"Dra. Mariana Alves",    typeLabel:"Psicóloga Clínica",   reg:"CRP 00/00000", credits:400, specs:["Ansiedade","Autoestima","Relacionamentos"], photo:"" },
    { id:2, name:"Rafael Monteiro",       typeLabel:"Hipnoterapeuta",      reg:"",             credits:350, specs:["Hipnose","Hábitos","Medos"],               photo:"" },
    { id:3, name:"Helena Duarte",         typeLabel:"Terapeuta Sistêmica", reg:"",             credits:380, specs:["Família","Constelação","Vínculos"],        photo:"" },
    { id:4, name:"Camila Torres",         typeLabel:"Terapeuta Integrativa",reg:"",            credits:320, specs:["Luto","Ansiedade","Autoconhecimento"],     photo:"" },
    { id:5, name:"André Vasconcelos",     typeLabel:"Terapeuta de Casais",  reg:"",            credits:360, specs:["Relacionamentos","Comunicação","Conflitos"],photo:"" }
  ],

  /* ─── 10. CATEGORIAS DA LOJA ─────────────────────────────────────────── */
  lojaCategories: [
    { id:"all",         label:"Todos" },
    { id:"audio",       label:"Áudios" },
    { id:"ebook",       label:"E-books" },
    { id:"ansiedade",   label:"Ansiedade" },
    { id:"depressao",   label:"Depressão" },
    { id:"feridas",     label:"Feridas Emocionais" },
    { id:"hipnose",     label:"Hipnose" },
    { id:"regressao",   label:"Regressão" },
    { id:"sexualidade", label:"Sexualidade" },
    { id:"corpo",       label:"Corpo e Emoções" }
  ],

  /* ─── 11. PRODUTOS DA LOJA — ÁUDIOS ──────────────────────────────────
     [futuro: tabela "products" (type='audio')]
     status: "disponivel" | "embreve" | "construcao" */
  lojaAudios: [
    { id:"a1",  cat:"ansiedade",   type:"audio", icon:"🌬️", tag:"Hipnose Terapêutica", tagClass:"hypno", title:"Controle da Ansiedade",
      desc:"Áudios guiados para desacelerar a mente, regular a respiração, reduzir tensão emocional e favorecer estados internos de calma.",
      count:6, price:50, status:"disponivel",
      about:"Coletânea de induções guiadas para acalmar a mente e o corpo em momentos de tensão e pensamento acelerado.",
      forwhom:"Pessoas que vivenciam ansiedade, agitação mental, dificuldade para relaxar ou tensão recorrente.",
      use:"Ouça em um lugar tranquilo, com fones de ouvido, em momentos de descanso. Não utilize dirigindo ou operando máquinas." },
    { id:"a2",  cat:"depressao",   type:"audio", icon:"🌅", tag:"Apoio Emocional", tagClass:"", title:"Autocuidado em Momentos de Tristeza",
      desc:"Conteúdos de apoio emocional para momentos de tristeza profunda, desânimo, vazio interior e reconexão com recursos internos.",
      count:5, price:50, status:"disponivel",
      about:"Áudios de acolhimento para momentos de desânimo e vazio, com foco em reconexão gentil com recursos internos.",
      forwhom:"Pessoas atravessando fases de tristeza, desânimo ou desconexão emocional, como apoio complementar.",
      use:"Ouça com calma, sem cobrança. Este é um recurso de apoio — em quadros persistentes, procure acompanhamento profissional." },
    { id:"a3",  cat:"feridas",     type:"audio", icon:"💗", tag:"Apoio Emocional", tagClass:"", title:"Tratamento das Feridas Emocionais",
      desc:"Induções e reflexões guiadas para trabalhar rejeição, abandono, humilhação, traição e injustiça emocional.",
      count:5, price:60, status:"disponivel",
      about:"Experiências guiadas sobre as cinco feridas emocionais, com reflexões para reconhecer e ressignificar padrões.",
      forwhom:"Quem deseja compreender padrões de rejeição, abandono, humilhação, traição e injustiça.",
      use:"Reserve um tempo só para você. Permita que as emoções surjam com acolhimento." },
    { id:"a4",  cat:"corpo",       type:"audio", icon:"🎈", tag:"Hipnose Terapêutica", tagClass:"hypno", title:"Balão Gástrico Hipnótico",
      desc:"Áudios de apoio hipnótico voltados à relação com o corpo, saciedade, autocontrole alimentar e hábitos mais conscientes.",
      count:4, price:60, status:"disponivel",
      about:"Induções hipnóticas de apoio à reeducação da relação com a comida e percepção de saciedade.",
      forwhom:"Pessoas que buscam uma relação mais consciente com a alimentação e o corpo.",
      use:"Ouça regularmente, em estado de relaxamento. Recurso de apoio — não substitui acompanhamento nutricional ou médico." },
    { id:"a5",  cat:"feridas",     type:"audio", icon:"🧸", tag:"Áudio Guiado", tagClass:"", title:"Tratando a Criança Interior",
      desc:"Experiências guiadas para acolhimento da criança interior, ressignificação emocional e reconexão com partes sensíveis da história pessoal.",
      count:5, price:55, status:"disponivel",
      about:"Jornadas guiadas de reencontro com a criança interior, para acolher memórias e necessidades afetivas antigas.",
      forwhom:"Quem deseja cuidar de carências emocionais e memórias da infância.",
      use:"Ouça em silêncio e privacidade, permitindo-se sentir. Tenha gentileza consigo após a experiência." },
    { id:"a6",  cat:"regressao",   type:"audio", icon:"🌀", tag:"Hipnose Terapêutica", tagClass:"hypno", title:"Regressão à Infância e Vida Intrauterina",
      desc:"Áudios conduzidos para exploração simbólica de memórias, sensações e registros emocionais ligados à infância e ao período intrauterino.",
      count:4, price:65, status:"disponivel",
      about:"Conduções simbólicas para explorar sensações e registros emocionais das primeiras fases da vida.",
      forwhom:"Pessoas com interesse em autoconhecimento profundo e exploração simbólica.",
      use:"Experiência imersiva — ouça deitado, em ambiente seguro. Conteúdo simbólico e reflexivo." },
    { id:"a7",  cat:"regressao",   type:"audio", icon:"🔮", tag:"Experiência Guiada", tagClass:"hypno", title:"Regressão a Vidas Passadas",
      desc:"Conteúdos voltados à investigação simbólica, imagética e terapêutica de narrativas internas associadas a outras existências.",
      count:3, price:70, status:"disponivel",
      about:"Jornadas imagéticas de caráter simbólico e reflexivo, exploração de narrativas internas.",
      forwhom:"Quem busca autoconhecimento por meio de experiências simbólicas e imaginativas.",
      use:"Conteúdo de natureza simbólica e exploratória. Ouça com mente aberta, em ambiente tranquilo." },
    { id:"a8",  cat:"corpo",       type:"audio", icon:"🌸", tag:"Apoio Emocional", tagClass:"", title:"Apoio no Climatério",
      desc:"Áudios de apoio emocional para mulheres em fase de climatério, com foco em acolhimento, autorregulação e reconexão com o corpo.",
      count:4, price:55, status:"disponivel",
      about:"Áudios de acolhimento para a transição do climatério, com foco em autorregulação e bem-estar.",
      forwhom:"Mulheres vivenciando o climatério que buscam apoio emocional complementar.",
      use:"Ouça em momentos de descanso. Recurso complementar — mantenha seu acompanhamento de saúde." },
    { id:"a9",  cat:"sexualidade", type:"audio", icon:"🌹", tag:"Conteúdo Adulto +18", tagClass:"adult", title:"Induções para Presença Corporal", adult:true,
      desc:"Conteúdos sensíveis e conscientes voltados ao despertar da presença corporal, intimidade, imaginação e conexão com a própria energia vital.",
      count:3, price:70, status:"disponivel",
      about:"Induções sensíveis voltadas à presença corporal, intimidade e conexão com a própria vitalidade.",
      forwhom:"Adultos (maiores de 18 anos) que desejam explorar presença e conexão corporal de forma consciente.",
      use:"Conteúdo adulto — acesso apenas para maiores de 18 anos. Ouça em total privacidade." },
    { id:"a10", cat:"sexualidade", type:"audio", icon:"💞", tag:"Apoio Emocional", tagClass:"", title:"Bem-Estar e Intimidade",
      desc:"Áudios terapêuticos de apoio à investigação emocional de bloqueios, insegurança, culpa, vergonha, desejo, intimidade e expressão afetiva.",
      count:4, price:60, status:"disponivel",
      about:"Áudios reflexivos de apoio à compreensão de bloqueios emocionais ligados à intimidade e afetividade.",
      forwhom:"Pessoas que desejam compreender inseguranças e bloqueios afetivos, como apoio complementar.",
      use:"Ouça com acolhimento. Recurso complementar — não substitui acompanhamento terapêutico individualizado quando necessário." }
  ],

  /* ─── 12. PRODUTOS DA LOJA — E-BOOKS ─────────────────────────────────
     [futuro: tabela "products" (type='ebook')]
     Para capa própria, use /public/images/ebooks/ no campo "cover" (futuro). */
  lojaEbooks: [
    { id:"e1", cat:"ansiedade", type:"ebook", color:"linear-gradient(135deg,#2d5a3d,#1e3528)", category:"Ansiedade", title:"Ansiedade: Quando a Mente Não Desliga",
      desc:"Um guia prático para compreender os sinais da ansiedade, organizar pensamentos acelerados e iniciar um caminho de autorregulação emocional.",
      price:40, status:"disponivel",
      about:"Guia prático para entender a ansiedade e desenvolver ferramentas de autorregulação no dia a dia.",
      forwhom:"Pessoas que convivem com ansiedade e desejam compreendê-la melhor.",
      use:"Leia no seu ritmo, aplicando os exercícios propostos gradualmente." },
    { id:"e2", cat:"feridas", type:"ebook", color:"linear-gradient(135deg,#b46e50,#8a4a30)", category:"Feridas Emocionais", title:"As Cinco Feridas Emocionais e os Caminhos de Cura Interior",
      desc:"Um e-book sobre rejeição, abandono, humilhação, traição e injustiça, com reflexões e exercícios para reconhecer padrões emocionais.",
      price:45, status:"disponivel",
      about:"Material reflexivo sobre as cinco feridas emocionais e como elas moldam padrões de comportamento.",
      forwhom:"Quem deseja reconhecer e ressignificar padrões emocionais antigos.",
      use:"Leia com pausas para reflexão. Realize os exercícios com gentileza consigo." },
    { id:"e3", cat:"feridas", type:"ebook", color:"linear-gradient(135deg,#c4a55a,#9a7a3a)", category:"Criança Interior", title:"Criança Interior: Acolher a Parte de Você que Ainda Espera Amor",
      desc:"Um material profundo e sensível para compreender carências antigas, memórias emocionais e necessidades afetivas não atendidas.",
      price:45, status:"disponivel",
      about:"Um convite sensível para reencontrar e acolher a criança interior e suas necessidades afetivas.",
      forwhom:"Pessoas que desejam cuidar de carências emocionais da infância.",
      use:"Leia em momentos tranquilos, permitindo-se sentir e refletir." },
    { id:"e4", cat:"corpo", type:"ebook", color:"linear-gradient(135deg,#3d6035,#2a4a26)", category:"Relacionamentos", title:"Relacionamentos Tóxicos, Dependência Emocional e Limites",
      desc:"Um guia para identificar padrões de apego, ciclos de sofrimento afetivo, dificuldade de dizer não e caminhos para reconstruir autonomia emocional.",
      price:45, status:"disponivel",
      about:"Guia para reconhecer dinâmicas afetivas adoecidas e reconstruir autonomia e limites saudáveis.",
      forwhom:"Quem vive ou viveu relações marcadas por dependência emocional.",
      use:"Leia refletindo sobre suas próprias relações, sem autocrítica excessiva." },
    { id:"e5", cat:"corpo", type:"ebook", color:"linear-gradient(135deg,#5a4060,#3a2848)", category:"Corpo e Emoções", title:"Corpo, Emoção e Autossabotagem",
      desc:"Um e-book sobre como emoções reprimidas, crenças inconscientes e padrões internos podem influenciar escolhas, hábitos e comportamentos repetitivos.",
      price:40, status:"disponivel",
      about:"Exploração de como emoções e crenças inconscientes influenciam hábitos e padrões de autossabotagem.",
      forwhom:"Pessoas que percebem padrões repetitivos de autossabotagem na vida.",
      use:"Leia observando seus próprios padrões com curiosidade e acolhimento." }
  ]
};
