export type PatientSummary = {
  id: string;
  name: string;
  avatar: string;
};

export const fakePatients: PatientSummary[] = [
  { id: "00001", name: "Mr. Glenn Quagmire", avatar: "PG" },
  { id: "00002", name: "Mr. John Doe", avatar: "JD" },
  { id: "00003", name: "Ms. Jane Smith", avatar: "JS" },
];
