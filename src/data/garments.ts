export type GarmentKind = "puffer" | "overshirt" | "knit" | "trousers";

export const garments = [
  {
    id: "01",
    name: "The cloud jacket",
    category: "QUILTED OUTERWEAR",
    color: "#343834",
    swatch: "#3c403b",
    shade: "Graphite",
    material:
      "A quilted silhouette, generous in volume. A high collar and a quiet, considered finish.",
    kind: "puffer" as GarmentKind,
    initialX: -3.75,
    length: 2.55,
  },
  {
    id: "02",
    name: "The field shirt",
    category: "EVERYDAY LAYERS",
    color: "#7d8875",
    swatch: "#909a83",
    shade: "Lichen",
    material:
      "An easy layer with a utilitarian spirit. Soft structure, roomy sleeves, and two patch pockets.",
    kind: "overshirt" as GarmentKind,
    initialX: -1.25,
    length: 2.65,
  },
  {
    id: "03",
    name: "The slow knit",
    category: "SOFT ESSENTIALS",
    color: "#d0c4aa",
    swatch: "#d5c9b1",
    shade: "Oat",
    material:
      "A familiar shape, softened. A round neckline, a relaxed shoulder, and a little extra room.",
    kind: "knit" as GarmentKind,
    initialX: 1.25,
    length: 2.6,
  },
  {
    id: "04",
    name: "The day trouser",
    category: "RELAXED FORMS",
    color: "#574238",
    swatch: "#635044",
    shade: "Earth",
    material:
      "A straight, unhurried silhouette. A structured waist falls into a soft, full-length leg.",
    kind: "trousers" as GarmentKind,
    initialX: 3.75,
    length: 3.65,
  },
] as const;

export const INITIAL_POSITIONS = garments.map((g) => g.initialX);
