export type PlzRow = {
  postal_code: string;
  municipality: string;
  canton: string;
  country: string;
};

export type MapZone = {
  id: string;
  groupId: string;
  name: string;
  /** Fill-Farbe (Hex), Rand folgt Auswahl/Hover-Logik in der Karte */
  color: string;
  center: [number, number];
  radius: number;
  plzData: PlzRow[];
};

export type ZoneGroupMeta = {
  id: string;
  label: string;
};
