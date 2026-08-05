export type RankEntry = {
  place: number;
  name: string;
  playerSlug: string;
  kingdom: string;
  kingdomSlug: string;
  score: number;
  wins: number;
};

export type RankBoard = {
  season: string;
  updatedLabel: string;
  entries: RankEntry[];
};

export type PlayerProfile = {
  slug: string;
  name: string;
  title: string;
  kingdom: string;
  kingdomSlug: string;
  place: number;
  score: number;
  wins: number;
  losses: number;
  bio: string;
};

export type KingdomProfile = {
  slug: string;
  name: string;
  motto: string;
  region: string;
  members: number;
  leader: string;
  leaderSlug: string;
  score: number;
  place: number;
  bio: string;
};

/** Placeholder até haver ranking persistido na API. */
export const seasonRanks: RankBoard = {
  season: 'Temporada I — Aurora',
  updatedLabel: 'Actualizado semanalmente',
  entries: [
    {
      place: 1,
      name: 'Lysandra',
      playerSlug: 'lysandra',
      kingdom: 'Norte de Ferro',
      kingdomSlug: 'norte-de-ferro',
      score: 18420,
      wins: 47
    },
    {
      place: 2,
      name: 'Kael',
      playerSlug: 'kael',
      kingdom: 'Mar de Cinzas',
      kingdomSlug: 'mar-de-cinzas',
      score: 17110,
      wins: 41
    },
    {
      place: 3,
      name: 'Orin',
      playerSlug: 'orin',
      kingdom: 'Vale Dourado',
      kingdomSlug: 'vale-dourado',
      score: 15880,
      wins: 39
    },
    {
      place: 4,
      name: 'Mira',
      playerSlug: 'mira',
      kingdom: 'Torre Silente',
      kingdomSlug: 'torre-silente',
      score: 14205,
      wins: 33
    },
    {
      place: 5,
      name: 'Thane',
      playerSlug: 'thane',
      kingdom: 'Campos de Ébano',
      kingdomSlug: 'campos-de-ebano',
      score: 13640,
      wins: 31
    },
    {
      place: 6,
      name: 'Sera',
      playerSlug: 'sera',
      kingdom: 'Aliança do Leste',
      kingdomSlug: 'alianca-do-leste',
      score: 12890,
      wins: 28
    },
    {
      place: 7,
      name: 'Vex',
      playerSlug: 'vex',
      kingdom: 'Ruínas Verdes',
      kingdomSlug: 'ruinas-verdes',
      score: 12150,
      wins: 26
    },
    {
      place: 8,
      name: 'Nox',
      playerSlug: 'nox',
      kingdom: 'Porto Negro',
      kingdomSlug: 'porto-negro',
      score: 11420,
      wins: 24
    }
  ]
};

const playerBios: Record<string, { title: string; losses: number; bio: string }> = {
  lysandra: {
    title: 'Senhora do Norte',
    losses: 9,
    bio: 'Comanda o Norte de Ferro com disciplina de ferro. Preferência por economia sólida e empurrões no final da partida.'
  },
  kael: {
    title: 'Almirante das Cinzas',
    losses: 12,
    bio: 'Especialista em pressão costeira. Raro perder um porto — raro partilhar um.'
  },
  orin: {
    title: 'Guardião do Vale',
    losses: 11,
    bio: 'Defesa paciente, contra-ataques brutais. O Vale Dourado cresce enquanto os outros gastam.'
  },
  mira: {
    title: 'Vigia da Torre',
    losses: 14,
    bio: 'Visão e informação. Prefere alianças curtas e golpes precisos.'
  },
  thane: {
    title: 'Senhor dos Campos',
    losses: 15,
    bio: 'Produção em massa e linhas de frente largas. Quando avança, o mapa treme.'
  },
  sera: {
    title: 'Emissária do Leste',
    losses: 16,
    bio: 'Diplomacia primeiro. Quando a mesa falha, a lâmina não.'
  },
  vex: {
    title: 'Herdeira das Ruínas',
    losses: 18,
    bio: 'Joga o mapa partido a seu favor. Emboscadas e rotas esquecidas.'
  },
  nox: {
    title: 'Senhor do Porto',
    losses: 19,
    bio: 'Comércio e bloqueios. Quem controla o mar controla o ritmo.'
  }
};

const kingdomBios: Record<string, { motto: string; region: string; members: number; bio: string }> = {
  'norte-de-ferro': {
    motto: 'Frio forja vontade',
    region: 'Terras Boreais',
    members: 24,
    bio: 'Reino de muralhas altas e invernos longos. Exporta ferro e disciplina.'
  },
  'mar-de-cinzas': {
    motto: 'Cinza sobe, império fica',
    region: 'Costa Ocidental',
    members: 19,
    bio: 'Portos vulcânicos e frotas rápidas. Domina o comércio marítimo da temporada.'
  },
  'vale-dourado': {
    motto: 'Ouro na raiz',
    region: 'Planícies Centrais',
    members: 21,
    bio: 'Campos férteis e minas antigas. Preferem prosperar antes de conquistar.'
  },
  'torre-silente': {
    motto: 'Ver sem ser visto',
    region: 'Montanhas do Eco',
    members: 12,
    bio: 'Poucos membros, muita informação. A torre observa o continente.'
  },
  'campos-de-ebano': {
    motto: 'Sombra na colheita',
    region: 'Sul Negro',
    members: 27,
    bio: 'Exércitos densos e madeira abundante. A pressão começa cedo.'
  },
  'alianca-do-leste': {
    motto: 'Um estandarte, muitas mãos',
    region: 'Fronteira Oriental',
    members: 31,
    bio: 'Confederação de casas menores. Força em números e acordos.'
  },
  'ruinas-verdes': {
    motto: 'O que cai, renasce',
    region: 'Floresta Quebrada',
    members: 15,
    bio: 'Território irregular, perfeito para guerrilha e emboscadas.'
  },
  'porto-negro': {
    motto: 'Maré e lei',
    region: 'Baía Escura',
    members: 18,
    bio: 'Hub comercial. Quem atraca aqui paga — ou luta.'
  }
};

export function getPlayer(slug: string): PlayerProfile | undefined {
  const entry = seasonRanks.entries.find((e) => e.playerSlug === slug);
  const extra = playerBios[slug];
  if (!entry || !extra) return undefined;
  return {
    slug,
    name: entry.name,
    title: extra.title,
    kingdom: entry.kingdom,
    kingdomSlug: entry.kingdomSlug,
    place: entry.place,
    score: entry.score,
    wins: entry.wins,
    losses: extra.losses,
    bio: extra.bio
  };
}

export function getKingdom(slug: string): KingdomProfile | undefined {
  const entry = seasonRanks.entries.find((e) => e.kingdomSlug === slug);
  const extra = kingdomBios[slug];
  if (!entry || !extra) return undefined;
  return {
    slug,
    name: entry.kingdom,
    motto: extra.motto,
    region: extra.region,
    members: extra.members,
    leader: entry.name,
    leaderSlug: entry.playerSlug,
    score: entry.score,
    place: entry.place,
    bio: extra.bio
  };
}

export function allPlayerSlugs() {
  return seasonRanks.entries.map((e) => e.playerSlug);
}

export function allKingdomSlugs() {
  return seasonRanks.entries.map((e) => e.kingdomSlug);
}
