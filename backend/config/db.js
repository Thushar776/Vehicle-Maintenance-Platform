const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vehicle_maintenance';
    
    try {
      // Short timeout for fallback detection
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
      console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    } catch (err) {
      console.warn(`Local MongoDB connection failed: ${err.message}`);
      
      if (process.env.NODE_ENV === 'development' || !process.env.MONGODB_URI) {
        console.log('Initializing in-memory MongoDB server fallback...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        
        mongoMemoryServer = await MongoMemoryServer.create();
        const memoryUri = mongoMemoryServer.getUri();
        
        await mongoose.connect(memoryUri);
        console.log(`In-Memory MongoDB Connected at: ${memoryUri}`);
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

