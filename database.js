import mongoose from "mongoose";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

// Validar que exista la URI de MongoDB
if (!process.env.MONGODB_URI) {
  console.error("❌ ERROR: MONGODB_URI no está definida en el archivo .env");
  console.error("⚠️  El servidor continuará sin base de datos");
} else if (process.env.NODE_ENV !== 'test') {
  // Solo conectar si NO estamos en modo test
  // En tests, usamos MongoDB Memory Server

  // Configurar mongoose
  mongoose.set('strictQuery', false);

  // Conectar a MongoDB (no bloqueante)
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("✅ Conexión a MongoDB establecida exitosamente");
      console.log(`📦 Base de datos: ${mongoose.connection.name}`);
    })
    .catch((error) => {
      console.error("❌ Error al conectar a MongoDB:", error.message);
      console.error("⚠️  El servidor continuará sin base de datos");
      console.error("💡 Verifica tu conexión a internet y las credenciales en .env");
    });
}

// Exportar mongoose para uso en la aplicación
export default mongoose;
