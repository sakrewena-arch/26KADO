export * from "./auth";

export const validationSchemas = {
  bookmaker: {
    name: { required: "Le nom est requis", minLength: 2 },
    slug: { required: "Le slug est requis" },
    bonus: { required: "Le bonus est requis" },
    color: { required: "La couleur est requise" },
  },
  commission: {
    amount: { required: "Le montant est requis", min: 0 },
    description: { required: "La description est requise" },
  },
  withdrawal: {
    amount: { required: "Le montant est requis", min: 5000, max: 1000000 },
    method: { required: "La méthode est requise" },
    accountInfo: { required: "Les informations du compte sont requises" },
  },
  upload: {
    bookmakerId: { required: "Le bookmaker est requis" },
    bookmakerUserId: { required: "L'ID bookmaker est requis" },
    depositAmount: { required: "Le montant est requis", min: 0 },
    depositDate: { required: "La date est requise" },
  },
  ticket: {
    subject: { required: "Le sujet est requis", minLength: 3 },
    description: { required: "La description est requise", minLength: 10 },
    category: { required: "La catégorie est requise" },
  },
  notification: {
    title: { required: "Le titre est requis" },
    message: { required: "Le message est requis" },
  },
  resource: {
    title: { required: "Le titre est requis" },
    type: { required: "Le type est requis" },
  },
  badge: {
    name: { required: "Le nom est requis" },
    description: { required: "La description est requise" },
    minCommission: { required: "La commission minimale est requise", min: 0 },
  },
  level: {
    name: { required: "Le nom est requis" },
    minCommission: { required: "La commission min est requise", min: 0 },
    maxCommission: { required: "La commission max est requise", min: 0 },
  },
  whatsapp: {
    url: { required: "L'URL est requise" },
    label: { required: "Le libellé est requis" },
  },
  faqCategory: {
    name: { required: "Le nom est requis" },
    slug: { required: "Le slug est requis" },
  },
  faq: {
    question: { required: "La question est requise" },
    answer: { required: "La réponse est requise" },
  },
  settings: {
    key: { required: "La clé est requise" },
    value: { required: "La valeur est requise" },
  },
} as const;