/**
 * Canonical HUEGLAM catalogue, ported from the Shopify store.
 * Prices are in paise. `npm run db:seed` inserts any of these whose handle is
 * not already in MongoDB; it never overwrites a product you have since edited.
 */

export type SeedImage = { src: string; alt: string; width: number; height: number };

export type SeedProduct = {
  handle: string;
  title: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  grams: number;
  tags: string[];
  inventory: number;
  position: number;
  description: string;
  bodyHtml: string;
  images: SeedImage[];
};

export const seedProducts: SeedProduct[] = [
  {
    handle: "hueglam-ultimate-glow-combo",
    title: "HUEGLAM Ultimate Glow Combo - Free Leather Bag ( Limited Stock )",
    sku: "HGSK005",
    price: 99900,
    compareAtPrice: null,
    grams: 230,
    tags: ["Cleanser", "Facewash", "MOISTURIZER", "Serum", "Sunscreen"],
    inventory: 25,
    position: 1,
    description:
      "Get the perfect skincare routine in one power-packed set - moisturizer, face wash, serum and sunscreen, plus a free leather bag.",
    bodyHtml: [
      "<p>Get the <strong>perfect skincare routine</strong> in one power-packed set!</p>",
      "<ul>",
      "<li>✔ <strong>Vitamin C Day Moisturizer</strong> &ndash; Hydrate &amp; brighten</li>",
      "<li>✔ <strong>3% Salicylic Acid Face Wash</strong> &ndash; Deep cleanse &amp; fight acne</li>",
      "<li>✔ <strong>10% Niacinamide Face Serum + 1% Zinc</strong> &ndash; Minimize pores &amp; control oil</li>",
      "<li>✔ <strong>Vitamin C Sunscreen SPF 50 PA+++</strong> &ndash; Protect &amp; glow all day</li>",
      "</ul>",
      "<p>Your skincare, simplified. Your glow, amplified!</p>",
    ].join("\n"),
    images: [
      {
        src: "/products/combo1_1-_2__final.jpg",
        alt: "HUEGLAM Ultimate Glow Combo with free leather bag",
        width: 720,
        height: 1080,
      },
    ],
  },
  {
    handle: "vitamin-c-sunscreen-spf-50-pa",
    title: "VITAMIN C SUNSCREEN SPF 50 PA+++",
    sku: "HGSK001",
    price: 24900,
    compareAtPrice: 49900,
    grams: 50,
    tags: ["Sunscreen"],
    inventory: 60,
    position: 2,
    description:
      "A conditioning sunscreen infused with ceramide and vitamin C to prevent fine lines and wrinkles and brighten the skin.",
    bodyHtml: [
      "<p>This conditioning sunscreen is infused with ceramide and vitamin C to prevent fine lines and wrinkles and brighten the skin.</p>",
      "<h3>Directions</h3>",
      "<p>Apply the sunscreen at least fifteen to thirty minutes before going outside so the formula can soak in. Ensure that you apply sunscreen to all the exposed parts of your body, including the face, ears, neck, and hands.</p>",
      "<h3>Active Ingredients</h3>",
      "<p>Ceramide &amp; Kojic Acid</p>",
      "<h3>Ingredients</h3>",
      '<p class="ingredients">Aqua, Glycerin, Propylene Glycol, Glyceryl Stearate, Benzophenone-3 (and) Phospholipids (and) 1,3-Butylene Glycol, Stearic Acid, Ethylhexyl Methoxycinnamate, Octocrylene, Butyl Methoxydibenzoylmethane (Avobenzone), Dicaprylyl Carbonate, Niacinamide (Vitamin B3), Kojic Acid, Ascorbic Acid, Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine, Tocopherol (Vitamin E), Sodium Hyaluronate, Xanthan Gum, Polyacrylate-13 (and) Polyisobutene (and) Polysorbate 20, Phenoxyethanol, Rosa Damascena (Rose) Flower Extract, Ceramide, Terminalia Ferdinandiana Fruit Extract.</p>',
    ].join("\n"),
    images: [
      { src: "/products/sunscreen.jpg", alt: "Vitamin C Sunscreen SPF 50 PA+++", width: 720, height: 1080 },
      { src: "/products/hue_p5.jpg", alt: "Vitamin C Sunscreen in use", width: 1080, height: 1350 },
      { src: "/products/sunscreen_box.jpg", alt: "Vitamin C Sunscreen packaging", width: 1080, height: 1620 },
    ],
  },
  {
    handle: "clarifying-face-serum-10-niacinamide-1-zinc",
    title: "Clarifying Face Serum 10 % NIACINAMIDE + 1% Zinc",
    sku: "HGSK003",
    price: 29900,
    compareAtPrice: 59900,
    grams: 29,
    tags: ["Serum"],
    inventory: 60,
    position: 3,
    description:
      "A clarifying serum with 10% niacinamide and 1% zinc to minimize pores, control oil and fade pigmentation.",
    bodyHtml: [
      "<h3>Active Ingredients</h3>",
      "<p>Ashwagandha and Glycyrrhiza Glabra Root Extract</p>",
      "<h3>Benefits</h3>",
      "<ol>",
      "<li>Boosts collagen</li>",
      "<li>Reduces pigmentation and dark spots</li>",
      "<li>Reduces texture on the skin</li>",
      "<li>Deeply hydrates skin</li>",
      "</ol>",
      "<h3>Ingredients</h3>",
      '<p class="ingredients">Aqua, Niacinamide, Glycinated Azelaic Acid, Gluconolactone, Propylene Glycol, Hyaluronic Acid, Glycyrrhiza Glabra Root (Licorice) Extract, Withania Somnifera Root (Ashwagandha) Extract, Vetiveria Zizanioides (Vetiver) Root Oil, Aloe Barbadensis Leaf (Aloe Vera) Extract, Cucumis Sativus (Cucumber) Extract, Glycerine, Xylitylglucoside (and) Anhydroxylitol (and) Xylitol, Camellia Sinensis Leaf (Green Tea) Extract, Potassium Sorbate, Zinc Oxide, Xanthan Gum, Sodium Benzoate, Sodium Gluconate, 2-Bromo-2-Nitropropane-1,3-Diol.</p>',
    ].join("\n"),
    images: [
      { src: "/products/serum_12.jpg", alt: "Clarifying Face Serum 10% Niacinamide + 1% Zinc", width: 720, height: 1080 },
      { src: "/products/serum234.jpg", alt: "Clarifying Face Serum in use", width: 1024, height: 1536 },
      { src: "/products/serum_bottle.jpg", alt: "Clarifying Face Serum bottle", width: 1080, height: 1620 },
    ],
  },
  {
    handle: "3-salicylic-acid-face-wash",
    title: "3% SALICYLIC ACID FACE WASH - Best for Oily & Acne Prone Skin",
    sku: "HGSK004",
    price: 14900,
    compareAtPrice: 29900,
    grams: 100,
    tags: ["Cleanser", "Facewash"],
    inventory: 60,
    position: 4,
    description:
      "A sulfate-free face wash designed to combat active acne with deep pore cleansing, without over-drying the skin.",
    bodyHtml: [
      "<p>Designed carefully to combat active acne, the sulfate-free facewash helps in deep pore cleansing and moisturizing. Cleansing out the impurities without over-drying the skin, which improves skin hydration &mdash; packed with Cucumber and Aloe Vera which act as a dehydrated skin savior!</p>",
      "<h3>Directions</h3>",
      "<p>Wet your face with water and use your fingertips to apply cleanser. Resist the temptation to scrub your skin because scrubbing irritates the skin. Rinse with water and pat dry with a soft towel, followed by our serum and moisturizer.</p>",
      "<h3>Active Ingredients</h3>",
      "<p>Niacinamide and Camellia Sinensis Leaf Extract</p>",
      "<h3>Ingredients</h3>",
      '<p class="ingredients">Aqua, Sodium Lauroyl Sarcosinate, Acrylates Copolymer, Cocamidopropyl Betaine, Decyl Glucoside, Cocomonoethanolamide, Salicylic Acid, Sodium PCA, Phenoxyethanol, Pentylene Glycol (and) Tamarindus Indica Seed Gum, Aloe Barbadensis Leaf (Aloe Vera) Extract, Camellia Sinensis Leaf (Green Tea) Extract, Cucumis Sativus (Cucumber) Extract, Hibiscus Sabdariffa Flower (Hibiscus) Extract, Glycyrrhiza Glabra (Licorice) Root Extract, Melaleuca Alternifolia Leaf Extract, Azadirachta Indica Leaf Extract, Calendula Officinalis Flower Extract, Rubia Cordifolia Stem (Manjishtha) Extract, Withania Somnifera Root (Ashwagandha) Extract, Xylitylglucoside (and) Anhydroxylitol (and) Xylitol, Niacinamide, Allantoin, Sodium Hydroxide, Blue Beads, Sodium Gluconate.</p>',
    ].join("\n"),
    images: [
      { src: "/products/facewash_1final.jpg", alt: "3% Salicylic Acid Face Wash", width: 720, height: 1080 },
      { src: "/products/facewash_4thaug.jpg", alt: "3% Salicylic Acid Face Wash in use", width: 1080, height: 1350 },
      { src: "/products/Faceswash_box.jpg", alt: "3% Salicylic Acid Face Wash packaging", width: 1080, height: 1620 },
    ],
  },
  {
    handle: "vitamin-c-day-moisturizer",
    title: "VITAMIN C DAY MOISTURIZER",
    sku: "HGSK002",
    price: 27400,
    compareAtPrice: 54900,
    grams: 50,
    tags: ["MOISTURIZER"],
    inventory: 60,
    position: 5,
    description:
      "An oil-free vitamin C moisturizer that fades pigmentation, reduces dullness and promotes collagen production.",
    bodyHtml: [
      "<p><strong>Vitamin C</strong> is a powerful ingredient that <strong>fades pigmentation</strong>, <strong>reduces dullness</strong>, and promotes <strong>collagen production</strong>, resulting in skin that has a youthful glow. It also keeps the skin moisturized without weighing it down, thanks to its non-comedogenic formula &mdash; and another brownie point is being the best oil-free moisturizer!</p>",
      "<h3>Directions</h3>",
      "<p>Apply the moisturizer in a circular motion to your forehead, cheeks and nose until your skin has fully absorbed the product. You should also apply moisturizer to your neck and chest to make sure these delicate areas are also moisturized. Apply it in the day time followed up by our Sunscreen SPF 50.</p>",
      "<h3>Active Ingredients</h3>",
      "<p>Hyaluronic Acid and Aloe Barbadensis Leaf Extract</p>",
      "<h3>Ingredients</h3>",
      '<p class="ingredients">Aqua, Caprylic Capric Triglyceride, Aloe Barbadensis Leaf Extract, Ascorbic Acid, Hyaluronic Acid, Glycyrrhiza Glabra (Licorice) Root Extract, Withania Somnifera Root (Ashwagandha) Extract, Cucumis Sativus (Cucumber) Extract, Hibiscus Sabdariffa Flower Extract, Curcuma Longa (Turmeric) Root Extract, Glycerine, Glyceryl Mono Stearate, Cetostearyl Alcohol, Isopropyl Myristate, Cetearyl Alcohol (and) Polysorbate 60, Sodium PCA, Niacinamide, Prunus Amygdalus Dulcis (Sweet Almond) Oil, Simmondsia Chinensis (Jojoba) Seed Oil, Phenoxyethanol, Triethylene Glycol, Tocopheryl Acetate, Allantoin, Xanthan Gum, Sodium Gluconate.</p>',
    ].join("\n"),
    images: [
      { src: "/products/Moisturizer.jpg", alt: "Vitamin C Day Moisturizer", width: 720, height: 1080 },
      { src: "/products/faceserum1instapost.jpg", alt: "Vitamin C Day Moisturizer in use", width: 1080, height: 1350 },
      { src: "/products/Moist_box.jpg", alt: "Vitamin C Day Moisturizer packaging", width: 1080, height: 1620 },
    ],
  },
];
