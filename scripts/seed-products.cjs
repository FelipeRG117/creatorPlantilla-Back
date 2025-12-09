/* Archivo renombrado a .cjs para ejecución como CommonJS en proyecto ES module */
// Copia exacta del seed-products.js original
const mongoose = require("mongoose");
require("dotenv").config();

// Product Schema (matching backend model)
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: {
      type: String,
      enum: [
        "instruments",
        "clothing",
        "accessories",
        "merch",
        "music",
        "other",
      ],
      required: true,
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, default: "" },
        altText: String,
        isPrimary: { type: Boolean, default: false },
        order: { type: Number, default: 0 },
      },
    ],
    variants: [
      {
        name: String,
        sku: String,
        price: Number,
        stock: { type: Number, default: 0 },
        attributes: {
          size: String,
          color: String,
        },
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
    },
    featured: { type: Boolean, default: false },
    tags: [String],
    metadata: {
      weight: Number,
      dimensions: {
        length: Number,
        width: Number,
        height: Number,
      },
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

// Sample products data
const sampleProducts = [
  {
    name: 'Vinilo "Corazón de Mariachi" - Edición Limitada',
    slug: "vinilo-corazon-mariachi-edicion-limitada",
    description:
      'Vinilo de 12" con las canciones más emblemáticas de Luis Carlos Gago. Edición limitada de coleccionista en vinilo negro premium de 180g. Incluye póster exclusivo de 30x30cm y letra de las canciones.',
    price: 899.0,
    category: "music",
    images: [
      {
        url: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=800&h=800&fit=crop",
        publicId: "products/vinyl-corazon",
        altText: "Vinilo Corazón de Mariachi",
        isPrimary: true,
        order: 0,
      },
    ],
    variants: [
      {
        name: "Standard",
        sku: "VIN-001",
        stock: 50,
        pricing: { basePrice: 899.0 },
        attributes: {},
      },
    ],
    status: "published",
    featured: true,
    tags: ["vinilo", "música", "edición limitada", "coleccionable"],
    metadata: {
      weight: 0.3,
      dimensions: { length: 31, width: 31, height: 0.5 },
    },
  },
  {
    name: 'Camiseta Oficial "Luis Carlos Gago Tour 2025"',
    slug: "camiseta-oficial-tour-2025",
    description:
      "Camiseta oficial del Tour 2025 de Luis Carlos Gago. Confeccionada en algodón 100% premium, corte unisex. Diseño exclusivo con logo dorado estampado en serigrafía de alta calidad.",
    price: 450.0,
    category: "clothing",
    images: [
      {
        url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop",
        publicId: "products/tshirt-tour",
        altText: "Camiseta Tour 2025",
        isPrimary: true,
        order: 0,
      },
    ],
    variants: [
      {
        name: "Chica",
        sku: "TSH-001-S",
        stock: 30,
        pricing: { basePrice: 450.0 },
        attributes: { size: "S", color: "Negro" },
      },
      {
        name: "Mediana",
        sku: "TSH-001-M",
        stock: 50,
        pricing: { basePrice: 450.0 },
        attributes: { size: "M", color: "Negro" },
      },
      {
        name: "Grande",
        sku: "TSH-001-L",
        stock: 40,
        pricing: { basePrice: 450.0 },
        attributes: { size: "L", color: "Negro" },
      },
      {
        name: "Extra Grande",
        sku: "TSH-001-XL",
        stock: 25,
        pricing: { basePrice: 450.0 },
        attributes: { size: "XL", color: "Negro" },
      },
    ],
    status: "published",
    featured: true,
    tags: ["camiseta", "ropa", "tour", "merchandising"],
    metadata: {
      weight: 0.2,
      dimensions: { length: 30, width: 25, height: 2 },
    },
  },
  {
    name: 'Gorra Bordada "LCG" - Edición Premium',
    slug: "gorra-bordada-lcg-premium",
    description:
      'Gorra de béisbol premium con bordado de alta calidad. Logo "LCG" bordado en hilo dorado sobre negro. Correa ajustable trasera metálica. Material transpirable de primera calidad.',
    price: 350.0,
    category: "accessories",
    images: [
      {
        url: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&h=800&fit=crop",
        publicId: "products/cap-lcg",
        altText: "Gorra LCG Premium",
        isPrimary: true,
        order: 0,
      },
    ],
    variants: [
      {
        name: "Talla Única",
        sku: "CAP-001",
        stock: 75,
        pricing: { basePrice: 350.0 },
        attributes: { size: "Ajustable", color: "Negro" },
      },
    ],
    status: "published",
    featured: false,
    tags: ["gorra", "accesorio", "premium"],
    metadata: {
      weight: 0.15,
      dimensions: { length: 20, width: 20, height: 12 },
    },
  },
  {
    name: 'Póster de Colección "Mariachi Legends" 50x70cm',
    slug: "poster-coleccion-mariachi-legends",
    description:
      "Póster artístico de edición limitada. Impresión en papel couché 300g con acabado mate. Imagen icónica de Luis Carlos Gago con su mariachi. Perfecto para enmarcar.",
    price: 280.0,
    category: "merch",
    images: [
      {
        url: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&h=800&fit=crop",
        publicId: "products/poster-legends",
        altText: "Póster Mariachi Legends",
        isPrimary: true,
        order: 0,
      },
    ],
    variants: [
      {
        name: "Standard",
        sku: "POST-001",
        stock: 100,
        pricing: { basePrice: 280.0 },
        attributes: {},
      },
    ],
    status: "published",
    featured: false,
    tags: ["póster", "decoración", "coleccionable"],
    metadata: {
      weight: 0.1,
      dimensions: { length: 70, width: 50, height: 0.1 },
    },
  },
  {
    name: 'Guitarrón Profesional "Maestro LCG"',
    slug: "guitarron-profesional-maestro-lcg",
    description:
      "Guitarrón profesional de concierto, creado por luthiers mexicanos. Madera de cedro rojo seleccionada, acabado brillante. Incluye funda acolchada y certificado de autenticidad firmado por Luis Carlos Gago.",
    price: 15999.0,
    category: "instruments",
    images: [
      {
        url: "https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?w=800&h=800&fit=crop",
        publicId: "products/guitarron-maestro",
        altText: "Guitarrón Maestro LCG",
        isPrimary: true,
        order: 0,
      },
    ],
    variants: [
      {
        name: "Standard",
        sku: "GUIT-001",
        stock: 5,
        pricing: { basePrice: 15999.0 },
        attributes: {},
      },
    ],
    status: "published",
    featured: true,
    tags: ["instrumento", "guitarrón", "profesional", "premium"],
    metadata: {
      weight: 4.5,
      dimensions: { length: 120, width: 50, height: 25 },
    },
  },
  {
    name: 'Sudadera con Capucha "Mariachi Soul"',
    slug: "sudadera-capucha-mariachi-soul",
    description:
      'Sudadera premium con capucha y bolsillo canguro. Mezcla de algodón y poliéster para máxima comodidad. Diseño exclusivo "Mariachi Soul" estampado en pecho y espalda. Interior afelpado.',
    price: 750.0,
    category: "clothing",
    images: [
      {
        url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=800&fit=crop",
        publicId: "products/hoodie-soul",
        altText: "Sudadera Mariachi Soul",
        isPrimary: true,
        order: 0,
      },
    ],
    variants: [
      {
        name: "Chica",
        sku: "HOOD-001-S",
        stock: 20,
        pricing: { basePrice: 750.0 },
        attributes: { size: "S", color: "Negro" },
      },
      {
        name: "Mediana",
        sku: "HOOD-001-M",
        stock: 35,
        pricing: { basePrice: 750.0 },
        attributes: { size: "M", color: "Negro" },
      },
      {
        name: "Grande",
        sku: "HOOD-001-L",
        stock: 30,
        pricing: { basePrice: 750.0 },
        attributes: { size: "L", color: "Negro" },
      },
      {
        name: "Extra Grande",
        sku: "HOOD-001-XL",
        stock: 20,
        pricing: { basePrice: 750.0 },
        attributes: { size: "XL", color: "Negro" },
      },
    ],
    status: "published",
    featured: false,
    tags: ["sudadera", "ropa", "capucha", "comfort"],
    metadata: {
      weight: 0.6,
      dimensions: { length: 35, width: 30, height: 5 },
    },
  },
  {
    name: 'Taza Cerámica "Morning Mariachi"',
    slug: "taza-ceramica-morning-mariachi",
    description:
      "Taza de cerámica premium de 350ml. Diseño artístico con frase inspiradora de Luis Carlos Gago. Apta para microondas y lavavajillas. Viene en caja de regalo elegante.",
    price: 220.0,
    category: "merch",
    images: [
      {
        url: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&h=800&fit=crop",
        publicId: "products/mug-morning",
        altText: "Taza Morning Mariachi",
        isPrimary: true,
        order: 0,
      },
    ],
    variants: [
      {
        name: "Standard",
        sku: "MUG-001",
        stock: 150,
        pricing: { basePrice: 220.0 },
        attributes: { color: "Blanco" },
      },
    ],
    status: "published",
    featured: false,
    tags: ["taza", "cerámica", "regalo", "coleccionable"],
    metadata: {
      weight: 0.35,
      dimensions: { length: 12, width: 9, height: 10 },
    },
  },
  {
    name: 'Llavero Metálico "LCG Logo"',
    slug: "llavero-metalico-lcg-logo",
    description:
      "Llavero de metal premium con baño de oro. Logo de Luis Carlos Gago grabado con láser. Incluye argolla giratoria de alta resistencia. Presentado en bolsa de terciopelo.",
    price: 150.0,
    category: "accessories",
    images: [
      {
        url: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&h=800&fit=crop",
        publicId: "products/keychain-logo",
        altText: "Llavero LCG Logo",
        isPrimary: true,
        order: 0,
      },
    ],
    variants: [
      {
        name: "Dorado",
        sku: "KEY-001-GOLD",
        stock: 200,
        pricing: { basePrice: 150.0 },
        attributes: { color: "Dorado" },
      },
      {
        name: "Plateado",
        sku: "KEY-001-SILVER",
        stock: 150,
        pricing: { basePrice: 150.0 },
        attributes: { color: "Plateado" },
      },
    ],
    status: "published",
    featured: false,
    tags: ["llavero", "accesorio", "metal", "logo"],
    metadata: {
      weight: 0.05,
      dimensions: { length: 6, width: 3, height: 0.5 },
    },
  },
];

// Main seed function
async function seedProducts() {
  try {
    console.log("🌱 Iniciando seed de productos...\n");

    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mariachi-web";
    console.log(`📦 Conectando a: ${mongoUri}`);

    await mongoose.connect(mongoUri);
    console.log("✅ Conectado a MongoDB\n");

    // Clear existing products
    const deleteResult = await Product.deleteMany({});
    console.log(
      `🗑️  Eliminados ${deleteResult.deletedCount} productos existentes\n`
    );

    // Insert sample products
    console.log("📝 Insertando productos de prueba...\n");
    const inserted = await Product.insertMany(sampleProducts);

    console.log("✅ Productos insertados exitosamente:\n");
    inserted.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   - ID: ${product._id}`);
      console.log(`   - Precio: $${product.price.toFixed(2)} MXN`);
      console.log(`   - Categoría: ${product.category}`);
      console.log(
        `   - Stock: ${product.variants.reduce(
          (sum, v) => sum + v.stock,
          0
        )} unidades`
      );
      console.log(`   - Featured: ${product.featured ? "Sí" : "No"}`);
      console.log("");
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`✅ SEED COMPLETADO`);
    console.log(`📊 Total productos: ${inserted.length}`);
    console.log(
      `💰 Valor total inventario: $${inserted
        .reduce(
          (sum, p) =>
            sum + p.price * p.variants.reduce((s, v) => s + v.stock, 0),
          0
        )
        .toFixed(2)} MXN`
    );
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("🚀 Ahora puedes:");
    console.log("   1. Abrir http://localhost:3002/tienda");
    console.log("   2. Ver los productos en el frontend");
    console.log("   3. Probar el flujo completo de compra\n");
  } catch (error) {
    console.error("❌ Error durante el seed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("👋 Desconectado de MongoDB");
    process.exit(0);
  }
}

// Run seed
seedProducts();
