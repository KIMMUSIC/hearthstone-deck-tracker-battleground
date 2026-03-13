/**
 * Battlegrounds hero card IDs.
 *
 * CardID strings are the internal identifiers used in Hearthstone's Power.log.
 * These follow the naming convention used in HearthDb.CardIds.
 *
 * Hero card IDs use either:
 * - "BG_HERO_XX" format (older heroes)
 * - "BG20_HERO_XXX" / "BG21_HERO_XXX" format (newer heroes)
 * - "TB_BaconShop_HERO_XX" format (original BG heroes)
 */
export const BG_HEROES = {
  // ── Original Battlegrounds Heroes (TB_BaconShop_HERO prefix) ──────
  AFK: "TB_BaconShop_HERO_44",
  Alexstrasza: "TB_BaconShop_HERO_56",
  Brann: "TB_BaconShop_HERO_43",
  Chenvaala: "TB_BaconShop_HERO_78",
  Dancin_Deryl: "TB_BaconShop_HERO_36",
  Deathwing: "TB_BaconShop_HERO_52",
  Edwin: "TB_BaconShop_HERO_46",
  Elise: "TB_BaconShop_HERO_42",
  Flurgl: "TB_BaconShop_HERO_61",
  Galakrond: "TB_BaconShop_HERO_02",
  George: "TB_BaconShop_HERO_15",
  Jandice: "TB_BaconShop_HERO_71",
  Jaraxxus: "TB_BaconShop_HERO_37",
  Kael_thas: "TB_BaconShop_HERO_60",
  Lich_King: "TB_BaconShop_HERO_22",
  Maiev: "TB_BaconShop_HERO_58",
  Malygos: "TB_BaconShop_HERO_08",
  Millhouse: "TB_BaconShop_HERO_49",
  Mukla: "TB_BaconShop_HERO_57",
  Nefarian: "TB_BaconShop_HERO_62",
  Nozdormu: "TB_BaconShop_HERO_57",
  Omu: "TB_BaconShop_HERO_74",
  Patches: "TB_BaconShop_HERO_18",
  Patchwerk: "TB_BaconShop_HERO_34",
  Pyramad: "TB_BaconShop_HERO_39",
  Rafaam: "TB_BaconShop_HERO_45",
  Rakanishu: "TB_BaconShop_HERO_75",
  Reno: "TB_BaconShop_HERO_41",
  Shudderwock: "TB_BaconShop_HERO_14",
  Sindragosa: "TB_BaconShop_HERO_54",
  Tess: "TB_BaconShop_HERO_50",
  Yogg: "TB_BaconShop_HERO_35",

  // ── Newer Heroes (BG_ prefix) ────────────────────────────────────
  Al_Akir: "BG_HERO_103",
  Aranna: "BG_HERO_59",
  Cap_n_Hoggarr: "BG_HERO_106",
  Cookie: "BG_HERO_201",
  Diablo: "BG_HERO_801",
  Drek_Thar: "BG_HERO_100",
  E_T_C: "BG_HERO_107",
  Gallywix: "BG_HERO_302",
  Guff: "BG_HERO_301",
  Heistbaron_Togwaggle: "BG_HERO_304",
  Illidan: "BG_HERO_108",
  Ini_Stormcoil: "BG_HERO_200",
  Cariel: "BG_HERO_105",
  Kurtrus: "BG_HERO_202",
  Mr_Bigglesworth: "BG_HERO_109",
  Murozond: "BG_HERO_110",
  Queen_Azshara: "BG_HERO_303",
  Rokara: "BG_HERO_101",
  Scabbs: "BG_HERO_305",
  Silas: "BG_HERO_307",
  Sneed: "BG_HERO_203",
  Tavish: "BG_HERO_102",
  Tamsin: "BG_HERO_104",
  Teron: "BG_HERO_308",
  Tickatus: "BG_HERO_204",
  Vanessa: "BG_HERO_111",
  Vanndar: "BG_HERO_300",
  Vol_jin: "BG_HERO_306",
  Voljin: "BG_HERO_306",
  Ysera: "BG_HERO_309",

  // ── Season 4+ Heroes (BG20/BG21/BG22 prefix) ─────────────────────
  Ambassador_Faelin: "BG20_HERO_201",
  Ozumat: "BG20_HERO_202",
  Sire_Denathrius: "BG20_HERO_301",
  Sylvanas: "BG20_HERO_101",
  The_Jailer: "BG21_HERO_000",
  Professor_Putricide: "BG21_HERO_100",
  Rock_Master_Voone: "BG22_HERO_100",
  Spirit_Healer: "BG22_HERO_101",

  // ── Special / Non-player ──────────────────────────────────────────
  Bob: "TB_BaconShop_HERO_PH",
} as const;

export type BgHeroCardId = (typeof BG_HEROES)[keyof typeof BG_HEROES];

/**
 * Mapping of hero card IDs to display names.
 * Used for UI rendering and logging.
 */
const heroDisplayNames: Record<string, string> = {
  [BG_HEROES.AFK]: "A.F.Kay",
  [BG_HEROES.Al_Akir]: "Al'Akir",
  [BG_HEROES.Alexstrasza]: "Alexstrasza",
  [BG_HEROES.Ambassador_Faelin]: "Ambassador Faelin",
  [BG_HEROES.Aranna]: "Aranna Starseeker",
  [BG_HEROES.Brann]: "Brann Bronzebeard",
  [BG_HEROES.Cap_n_Hoggarr]: "Cap'n Hoggarr",
  [BG_HEROES.Cariel]: "Cariel Roame",
  [BG_HEROES.Chenvaala]: "Chenvaala",
  [BG_HEROES.Cookie]: "Cookie the Cook",
  [BG_HEROES.Dancin_Deryl]: "Dancin' Deryl",
  [BG_HEROES.Deathwing]: "Deathwing",
  [BG_HEROES.Diablo]: "Diablo",
  [BG_HEROES.Drek_Thar]: "Drek'Thar",
  [BG_HEROES.E_T_C]: "E.T.C., Band Manager",
  [BG_HEROES.Edwin]: "Edwin VanCleef",
  [BG_HEROES.Elise]: "Elise Starseeker",
  [BG_HEROES.Flurgl]: "King Bagurgle",
  [BG_HEROES.Galakrond]: "Galakrond",
  [BG_HEROES.Gallywix]: "Trade Prince Gallywix",
  [BG_HEROES.George]: "George the Fallen",
  [BG_HEROES.Guff]: "Guff Runetotem",
  [BG_HEROES.Heistbaron_Togwaggle]: "Heistbaron Togwaggle",
  [BG_HEROES.Illidan]: "Illidan Stormrage",
  [BG_HEROES.Ini_Stormcoil]: "Ini Stormcoil",
  [BG_HEROES.Jandice]: "Jandice Barov",
  [BG_HEROES.Jaraxxus]: "Lord Jaraxxus",
  [BG_HEROES.Kael_thas]: "Kael'thas Sunstrider",
  [BG_HEROES.Kurtrus]: "Kurtrus Ashfallen",
  [BG_HEROES.Lich_King]: "The Lich King",
  [BG_HEROES.Maiev]: "Maiev Shadowsong",
  [BG_HEROES.Malygos]: "Malygos",
  [BG_HEROES.Millhouse]: "Millhouse Manastorm",
  [BG_HEROES.Mr_Bigglesworth]: "Mr. Bigglesworth",
  [BG_HEROES.Mukla]: "King Mukla",
  [BG_HEROES.Murozond]: "Murozond the Infinite",
  [BG_HEROES.Nefarian]: "Nefarian",
  [BG_HEROES.Omu]: "Forest Warden Omu",
  [BG_HEROES.Ozumat]: "Ozumat",
  [BG_HEROES.Patches]: "Patches the Pirate",
  [BG_HEROES.Patchwerk]: "Patchwerk",
  [BG_HEROES.Professor_Putricide]: "Professor Putricide",
  [BG_HEROES.Pyramad]: "Pyramad",
  [BG_HEROES.Queen_Azshara]: "Queen Azshara",
  [BG_HEROES.Rafaam]: "Arch-Villain Rafaam",
  [BG_HEROES.Rakanishu]: "Rakanishu",
  [BG_HEROES.Reno]: "Reno Jackson",
  [BG_HEROES.Rock_Master_Voone]: "Rock Master Voone",
  [BG_HEROES.Rokara]: "Rokara",
  [BG_HEROES.Scabbs]: "Scabbs Cutterbutter",
  [BG_HEROES.Shudderwock]: "Shudderwock",
  [BG_HEROES.Silas]: "Silas Darkmoon",
  [BG_HEROES.Sindragosa]: "Sindragosa",
  [BG_HEROES.Sire_Denathrius]: "Sire Denathrius",
  [BG_HEROES.Sneed]: "Sneed",
  [BG_HEROES.Spirit_Healer]: "Spirit Healer",
  [BG_HEROES.Sylvanas]: "Sylvanas Windrunner",
  [BG_HEROES.Tamsin]: "Tamsin Roame",
  [BG_HEROES.Tavish]: "Tavish Stormpike",
  [BG_HEROES.Teron]: "Teron Gorefiend",
  [BG_HEROES.Tess]: "Tess Greymane",
  [BG_HEROES.The_Jailer]: "The Jailer",
  [BG_HEROES.Tickatus]: "Tickatus",
  [BG_HEROES.Vanessa]: "Vanessa VanCleef",
  [BG_HEROES.Vanndar]: "Vanndar Stormpike",
  [BG_HEROES.Vol_jin]: "Vol'jin",
  [BG_HEROES.Yogg]: "Yogg-Saron, Hope's End",
  [BG_HEROES.Ysera]: "Ysera",
  [BG_HEROES.Bob]: "Bartender Bob",
};

/**
 * Get the display name for a hero card ID.
 * Returns the cardId itself if no display name is registered.
 */
export function getHeroDisplayName(cardId: string): string {
  return heroDisplayNames[cardId] ?? cardId;
}
