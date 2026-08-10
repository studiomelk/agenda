export type RecoveredAssignment = {
  name: string;
  role: "Foto" | "Vídeo";
};

export type RecoveredEvent = {
  id: string;
  date: string;
  time: string;
  title: string;
  place: string;
  team: RecoveredAssignment[];
};

export const recoveredTeam = [
  "Márcio", "Dinho", "Danilo", "Diego", "Luiz", "Benedito",
  "Sala", "Jean", "Anderson", "Filipe", "Ricardo Carvalho",
] as const;

export const recoveredEvents: RecoveredEvent[] = [
  { id: "e1", date: "2026-01-24", time: "19:00", title: "15 Anos - Isabella", place: "Vila Andrade", team: [{ name: "Márcio", role: "Foto" }, { name: "Dinho", role: "Foto" }, { name: "Diego", role: "Foto" }] },
  { id: "e2", date: "2026-02-14", time: "11:00", title: "Casamento - Vinicius & Ariane", place: "Matriz Monte Serrat", team: [{ name: "Márcio", role: "Foto" }, { name: "Danilo", role: "Foto" }] },
  { id: "e3", date: "2026-02-22", time: "11:30", title: "80 Anos - Maria de Lourdes", place: "Salão Estilo Marcado", team: [{ name: "Márcio", role: "Foto" }] },
  { id: "e4", date: "2026-02-28", time: "16:00", title: "Casamento - Isabella & Osmar", place: "Lago Esmeralda", team: [{ name: "Márcio", role: "Foto" }, { name: "Benedito", role: "Foto" }, { name: "Sala", role: "Foto" }, { name: "Diego", role: "Vídeo" }, { name: "Dinho", role: "Vídeo" }, { name: "Danilo", role: "Vídeo" }] },
  { id: "e5", date: "2026-03-07", time: "15:00", title: "Casamento - Rafaela & Andre", place: "Igreja São Benedito", team: [{ name: "Márcio", role: "Foto" }, { name: "Dinho", role: "Foto" }, { name: "Benedito", role: "Foto" }] },
  { id: "e6", date: "2026-03-14", time: "16:00", title: "Casamento - Hevyllyn & Rafael", place: "Rancho do Zanoni", team: [{ name: "Márcio", role: "Foto" }, { name: "Dinho", role: "Vídeo" }, { name: "Luiz", role: "Vídeo" }] },
  { id: "e7", date: "2026-03-22", time: "18:00", title: "Casamento - Grace & Wanderson", place: "Château de Lumiere", team: [{ name: "Márcio", role: "Foto" }, { name: "Danilo", role: "Foto" }, { name: "Diego", role: "Vídeo" }, { name: "Dinho", role: "Vídeo" }, { name: "Luiz", role: "Vídeo" }] },
  { id: "e8", date: "2026-04-25", time: "17:00", title: "Casamento - Ananda & Pedro", place: "Igreja Matriz Itu", team: [{ name: "Sala", role: "Foto" }, { name: "Jean", role: "Foto" }] },
  { id: "e9", date: "2026-04-25", time: "16:40", title: "Casamento - Luciane Webberton", place: "Rancho Bento Olívio", team: [{ name: "Márcio", role: "Foto" }, { name: "Benedito", role: "Foto" }, { name: "Dinho", role: "Foto" }, { name: "Diego", role: "Vídeo" }, { name: "Anderson", role: "Vídeo" }, { name: "Filipe", role: "Vídeo" }] },
  { id: "e10", date: "2026-05-01", time: "00:00", title: "Casamento - Bárbara & Rodrigo", place: "A definir", team: [{ name: "Márcio", role: "Foto" }, { name: "Benedito", role: "Foto" }, { name: "Danilo", role: "Foto" }, { name: "Diego", role: "Vídeo" }, { name: "Luiz", role: "Vídeo" }, { name: "Dinho", role: "Vídeo" }] },
  { id: "e11", date: "2026-05-09", time: "00:00", title: "15 Anos - Camilly", place: "A definir", team: [{ name: "Márcio", role: "Foto" }, { name: "Jean", role: "Foto" }, { name: "Dinho", role: "Vídeo" }, { name: "Luiz", role: "Vídeo" }] },
  { id: "e12", date: "2026-06-13", time: "11:00", title: "Casamento - Isabelly & Gabriel", place: "Matriz Monte Serrat", team: [{ name: "Márcio", role: "Foto" }] },
  { id: "e13", date: "2026-06-27", time: "16:00", title: "Casamento - Gabriela & Pedro", place: "Espaço Santa Rita", team: [{ name: "Márcio", role: "Foto" }, { name: "Dinho", role: "Foto" }] },
  { id: "e14", date: "2026-07-25", time: "15:00", title: "Casamento - Luana & Ryan", place: "Salão Eventos São José", team: [{ name: "Dinho", role: "Foto" }, { name: "Benedito", role: "Foto" }] },
  { id: "e15", date: "2026-07-25", time: "17:30", title: "Casamento - Liliane & Fernando", place: "Capela Patrocínio", team: [{ name: "Márcio", role: "Foto" }, { name: "Sala", role: "Foto" }, { name: "Jean", role: "Foto" }, { name: "Diego", role: "Vídeo" }, { name: "Anderson", role: "Vídeo" }, { name: "Luiz", role: "Vídeo" }] },
  { id: "e16", date: "2026-08-08", time: "16:00", title: "Casamento - Vitória & Samuel", place: "Éden Sorocaba", team: [] },
  { id: "e17", date: "2026-08-22", time: "16:15", title: "Casamento - Nathalia & Victor", place: "Paróquia Aparecida", team: [{ name: "Márcio", role: "Foto" }, { name: "Dinho", role: "Vídeo" }, { name: "Luiz", role: "Vídeo" }] },
  { id: "e18", date: "2026-09-12", time: "15:30", title: "Casamento - Ana Caroline & Antonio Felipe", place: "Paróquia São Benedito", team: [{ name: "Márcio", role: "Foto" }, { name: "Sala", role: "Foto" }, { name: "Benedito", role: "Foto" }, { name: "Dinho", role: "Vídeo" }, { name: "Luiz", role: "Vídeo" }] },
  { id: "e19", date: "2026-10-10", time: "00:00", title: "Casamento - Pérola & Leno", place: "Chácara Paradise Eventos", team: [{ name: "Márcio", role: "Foto" }, { name: "Ricardo Carvalho", role: "Foto" }] },
  { id: "e20", date: "2026-10-10", time: "16:00", title: "Casamento - Nataly & Guilherme", place: "Espaço 55", team: [{ name: "Sala", role: "Foto" }, { name: "Jean", role: "Foto" }, { name: "Danilo", role: "Foto" }] },
  { id: "e21", date: "2026-11-07", time: "15:00", title: "Casamento - Vania & Ismael", place: "Igreja São Luiz Gonzaga", team: [] },
  { id: "e22", date: "2026-12-12", time: "00:00", title: "Casamento - Letícia & Kauã", place: "A definir", team: [{ name: "Márcio", role: "Foto" }, { name: "Benedito", role: "Foto" }, { name: "Diego", role: "Vídeo" }, { name: "Dinho", role: "Vídeo" }, { name: "Luiz", role: "Vídeo" }] },
];
