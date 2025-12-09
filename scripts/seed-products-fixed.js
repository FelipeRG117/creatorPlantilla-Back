/**
 * Seed Products Script - Backend Compatible
 *
 * Agrega productos con la estructura correcta del modelo Product del backend
 * Ejecutar: node scripts/seed-products-fixed.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Import Product model from backend
import Product from '../src/models/model.product.js';

// Sample products data - MATCHING BACKEND SCHEMA
const sampleProducts = [
  {
    name: 'Vinilo "Corazón de Mariachi" - Edición Limitada',
    slug: 'vinilo-corazon-mariachi-edicion-limitada',
    description: 'Vinilo de 12" con las canciones más emblemáticas de Luis Carlos Gago. Edición limitada de coleccionista en vinilo negro premium de 180g. Incluye póster exclusivo de 30x30cm y letra de las canciones.',
    shortDescription: 'Vinilo premium de 180g con las mejores canciones de Luis Carlos Gago',
    category: 'music',
    subcategory: 'Vinyl Records',
    tags: ['vinilo', 'música', 'edición limitada', 'coleccionable'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=800&h=800&fit=crop',
        publicId: 'products/vinyl-corazon',
        altText: 'Vinilo Corazón de Mariachi',
        isPrimary: true,
        order: 0
      }
    ],
    variants: [
      {
        sku: 'VIN-001-BLK',
        name: 'Vinilo Negro 180g',
        attributes: {
          size: 'N/A',
          color: 'Negro',
          material: 'Vinilo 180g'
        },
        pricing: {
          basePrice: 899.00,
          currency: 'MXN'
        },
        inventory: {
          stock: 50,
          lowStockThreshold: 10,
          trackInventory: true,
          allowBackorder: false
        },
        isActive: true
      }
    ],
    brand: 'Luis Carlos Gago',
    status: 'published',
    isFeatured: true,
    isNewArrival: false,
    features: [
      'Vinilo 180g de alta calidad',
      'Póster exclusivo 30x30cm incluido',
      'Letras de todas las canciones',
      'Edición limitada numerada'
    ],
    shipping: {
      isFreeShipping: false,
      shippingClass: 'fragile'
    }
  },
  {
    name: 'Camiseta Oficial "Luis Carlos Gago Tour 2025"',
    slug: 'camiseta-oficial-tour-2025',
    description: 'Camiseta oficial del Tour 2025 de Luis Carlos Gago. Confeccionada en algodón 100% premium, corte unisex. Diseño exclusivo con logo dorado estampado en serigrafía de alta calidad.',
    shortDescription: 'Camiseta oficial Tour 2025 - Algodón 100%',
    category: 'apparel',
    subcategory: 'T-Shirts',
    tags: ['camiseta', 'ropa', 'tour', 'merchandising'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
        publicId: 'products/tshirt-tour',
        altText: 'Camiseta Tour 2025',
        isPrimary: true,
        order: 0
      }
    ],
    variants: [
      {
        sku: 'TSH-001-S-BLK',
        name: 'Chica',
        attributes: { size: 'S', color: 'Negro', material: 'Algodón 100%' },
        pricing: { basePrice: 450.00, currency: 'MXN' },
        inventory: { stock: 30, lowStockThreshold: 5, trackInventory: true, allowBackorder: false },
        isActive: true
      },
      {
        sku: 'TSH-001-M-BLK',
        name: 'Mediana',
        attributes: { size: 'M', color: 'Negro', material: 'Algodón 100%' },
        pricing: { basePrice: 450.00, currency: 'MXN' },
        inventory: { stock: 50, lowStockThreshold: 5, trackInventory: true, allowBackorder: false },
        isActive: true
      },
      {
        sku: 'TSH-001-L-BLK',
        name: 'Grande',
        attributes: { size: 'L', color: 'Negro', material: 'Algodón 100%' },
        pricing: { basePrice: 450.00, currency: 'MXN' },
        inventory: { stock: 40, lowStockThreshold: 5, trackInventory: true, allowBackorder: false },
        isActive: true
      },
      {
        sku: 'TSH-001-XL-BLK',
        name: 'Extra Grande',
        attributes: { size: 'XL', color: 'Negro', material: 'Algodón 100%' },
        pricing: { basePrice: 450.00, currency: 'MXN' },
        inventory: { stock: 25, lowStockThreshold: 5, trackInventory: true, allowBackorder: false },
        isActive: true
      }
    ],
    brand: 'Luis Carlos Gago',
    status: 'published',
    isFeatured: true,
    isNewArrival: true,
    features: ['Algodón 100% premium', 'Corte unisex', 'Estampado en serigrafía', 'Diseño exclusivo'],
    shipping: { isFreeShipping: false, shippingClass: 'standard' }
  },
  {
    name: 'Gorra Bordada "LCG" - Edición Premium',
    slug: 'gorra-bordada-lcg-premium',
    description: 'Gorra de béisbol premium con bordado de alta calidad. Logo "LCG" bordado en hilo dorado sobre negro. Correa ajustable trasera metálica. Material transpirable de primera calidad.',
    shortDescription: 'Gorra premium con bordado LCG en oro',
    category: 'accessories',
    subcategory: 'Caps',
    tags: ['gorra', 'accesorio', 'premium'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&h=800&fit=crop',
        publicId: 'products/cap-lcg',
        altText: 'Gorra LCG Premium',
        isPrimary: true,
        order: 0
      }
    ],
    variants: [
      {
        sku: 'CAP-001-ADJ',
        name: 'Talla Única Ajustable',
        attributes: { size: 'Unitalla', color: 'Negro' },
        pricing: { basePrice: 350.00, currency: 'MXN' },
        inventory: { stock: 75, lowStockThreshold: 15, trackInventory: true, allowBackorder: false },
        isActive: true
      }
    ],
    brand: 'Luis Carlos Gago',
    status: 'published',
    isFeatured: false,
    isNewArrival: false,
    features: ['Bordado premium en oro', 'Ajustable (una talla)', 'Material transpirable', 'Correa metálica'],
    shipping: { isFreeShipping: false, shippingClass: 'standard' }
  },
  {
    name: 'Guitarrón Profesional "Maestro LCG"',
    slug: 'guitarron-profesional-maestro-lcg',
    description: 'Guitarrón profesional de concierto, creado por luthiers mexicanos. Madera de cedro rojo seleccionada, acabado brillante. Incluye funda acolchada premium y certificado de autenticidad firmado por Luis Carlos Gago.',
    shortDescription: 'Guitarrón profesional hecho por luthiers mexicanos',
    category: 'instruments',
    subcategory: 'String Instruments',
    tags: ['instrumento', 'guitarrón', 'profesional', 'premium', 'hecho a mano'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?w=800&h=800&fit=crop',
        publicId: 'products/guitarron-maestro',
        altText: 'Guitarrón Maestro LCG',
        isPrimary: true,
        order: 0
      }
    ],
    variants: [
      {
        sku: 'GUIT-001-PRO',
        name: 'Guitarrón Profesional',
        attributes: { size: 'N/A', material: 'Cedro Rojo' },
        pricing: { basePrice: 15999.00, currency: 'MXN' },
        inventory: { stock: 5, lowStockThreshold: 2, trackInventory: true, allowBackorder: true },
        weight: { value: 4.5, unit: 'kg' },
        dimensions: { length: 120, width: 50, height: 25, unit: 'cm' },
        isActive: true
      }
    ],
    brand: 'Luis Carlos Gago',
    status: 'published',
    isFeatured: true,
    isNewArrival: false,
    features: [
      'Hecho por luthiers mexicanos',
      'Madera de cedro rojo seleccionada',
      'Acabado brillante profesional',
      'Incluye funda acolchada premium',
      'Certificado de autenticidad firmado'
    ],
    shipping: { isFreeShipping: true, shippingClass: 'fragile' }
  }
];

// Main seed function
async function seedProducts() {
  try {
    console.log('🌱 Iniciando seed de productos (Backend Compatible)...\n');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    console.log(`📦 Conectando a MongoDB...`);

    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB\n');

    // Clear existing products
    const deleteResult = await Product.deleteMany({});
    console.log(`🗑️  Eliminados ${deleteResult.deletedCount} productos existentes\n`);

    // Insert sample products
    console.log('📝 Insertando productos de prueba...\n');
    const inserted = await Product.insertMany(sampleProducts);

    console.log('✅ Productos insertados exitosamente:\n');
    inserted.forEach((product, index) => {
      const totalStock = product.variants.reduce((sum, v) => sum + v.inventory.stock, 0);
      const price = product.variants[0]?.pricing.basePrice || 0;

      console.log(`${index + 1}. ${product.name}`);
      console.log(`   - ID: ${product._id}`);
      console.log(`   - Precio: $${price.toFixed(2)} MXN`);
      console.log(`   - Categoría: ${product.category}`);
      console.log(`   - Variantes: ${product.variants.length}`);
      console.log(`   - Stock total: ${totalStock} unidades`);
      console.log(`   - Featured: ${product.isFeatured ? 'Sí' : 'No'}`);
      console.log(`   - New Arrival: ${product.isNewArrival ? 'Sí' : 'No'}`);
      console.log('');
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ SEED COMPLETADO`);
    console.log(`📊 Total productos: ${inserted.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🚀 Ahora puedes:');
    console.log('   1. Abrir http://localhost:3002/tienda');
    console.log('   2. Ver los productos en el frontend');
    console.log('   3. Probar el flujo completo de compra\n');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

// Run seed
seedProducts();
