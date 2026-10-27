import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Conectado a MongoDB (${conn.connection.host})`);
  } catch (error) {
    console.error(`No se pudo conectar a MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
