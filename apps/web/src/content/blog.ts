export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  dateLabel: string;
  category: string;
  body: string[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'temporada-aurora',
    title: 'Temporada Aurora: o mapa abre-se',
    excerpt:
      'Novas rotas de comércio, biomas nocturnos e o primeiro ranking oficial da era.',
    date: '2026-08-01',
    dateLabel: '1 Ago 2026',
    category: 'Actualização',
    body: [
      'A Temporada Aurora marca o início oficial das crónicas de Age of AI. O mundo cresce: rotas mercantis ligam reinos distantes, e a noite deixa de ser só atmosfera — passa a alterar produção e visão.',
      'Com o ranking semanal, cada vitória conta para o teu lugar na história. Sobe no ranking, defende o teu reino e deixa o nome do teu império gravado na temporada.',
      'Entra no lobby público ou cria uma sala privada. A Aurora já começou.'
    ]
  },
  {
    slug: 'guia-primeiro-reino',
    title: 'Guia: o teu primeiro reino em 10 minutos',
    excerpt:
      'Recursos, aldeões e a primeira muralha — o caminho curto para não começares perdido.',
    date: '2026-07-22',
    dateLabel: '22 Jul 2026',
    category: 'Guia',
    body: [
      'Começa por comida e madeira. Sem aldeões a trabalhar, o exército é só um desejo.',
      'Constrói a casa cedo: população é o travão invisível de quase todos os reinos novos.',
      'Quando tiveres excedente, explora o mapa. Fog of war esconde oportunidades — e ameaças.'
    ]
  },
  {
    slug: 'aliancas-e-comercio',
    title: 'Alianças que vencem guerras',
    excerpt:
      'Comércio não é só ouro: é informação, timing e pressão conjunta no mapa.',
    date: '2026-07-10',
    dateLabel: '10 Jul 2026',
    category: 'Estratégia',
    body: [
      'Uma aliança fraca partilha chat. Uma aliança forte partilha objectivos: quem segura a frente, quem flutua recursos, quem fecha o cerco.',
      'O comércio acelera o teu ponto fraco. Se falta pedra, não force — negocia e mantém o ritmo de produção.',
      'No ranking, as alianças consistentes sobem juntas. Isolamento é romance; coordenação é império.'
    ]
  },
  {
    slug: 'notas-servidor',
    title: 'Notas do reino: salas, nós e matchmaking',
    excerpt:
      'Como as partidas encontram um game-server e porque o teu lobby fica isolado.',
    date: '2026-08-05',
    dateLabel: '5 Ago 2026',
    category: 'Técnico',
    body: [
      'Cada partida vive num nó de jogo. A API escolhe o menos carregado e o cliente liga-se directamente a esse WebSocket.',
      'Lobby público e salas privadas não se misturam: o teu mapa é o teu mapa.',
      'Se um nó cair, a próxima sessão pode nascer noutro. Persistência completa de partida continua a evoluir.'
    ]
  }
];

export function getPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getFeaturedPost(): BlogPost {
  return blogPosts[0];
}
