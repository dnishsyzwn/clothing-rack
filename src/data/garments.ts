export type GarmentKind = "tee" | "long-sleeve" | "trousers";

export const garments = [
  {
    id: "01",
    name: "The everyday tee",
    category: "RELAXED COTTON FORMS",
    color: "#30332e",
    swatch: "#3c403b",
    shade: "Graphite",
    material:
      "An easy, unstructured tee. A softly gathered neckline and natural folds, resting on a wooden hanger.",
    kind: "tee" as GarmentKind,
    initialX: -3.75,
    length: 3.1433,
    width: 1.8829,
  },
  {
    id: "02",
    name: "The long sleeve",
    category: "EVERYDAY LAYERS",
    color: "#7b856f",
    swatch: "#909a83",
    shade: "Lichen",
    material:
      "A loose long sleeve with a quiet drape. Soft fabric falls from the shoulders into an irregular, lived-in hem.",
    kind: "long-sleeve" as GarmentKind,
    initialX: -1.25,
    length: 3.1105,
    width: 1.8491,
  },
  {
    id: "03",
    name: "The studio tee",
    category: "SOFT ESSENTIALS",
    color: "#d1c6ae",
    swatch: "#d5c9b1",
    shade: "Oat",
    material:
      "The familiar everyday tee in a warm oat colorway. Light catches the weave and the soft folds of its full silhouette.",
    kind: "tee" as GarmentKind,
    initialX: 1.25,
    length: 3.1433,
    width: 1.8829,
  },
  {
    id: "04",
    name: "The folded trouser",
    category: "RELAXED FORMS",
    color: "#59483c",
    swatch: "#635044",
    shade: "Earth",
    material:
      "A tailored trouser, folded over its hanger bar. A natural crease, layered fabric, and a considered way to hang.",
    kind: "trousers" as GarmentKind,
    initialX: 3.75,
    length: 3.2335,
    width: 1.2161,
  },
] as const;

export const INITIAL_POSITIONS = garments.map((g) => g.initialX);
