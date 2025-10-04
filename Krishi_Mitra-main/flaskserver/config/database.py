from pymongo import MongoClient
from datetime import datetime
import os
try:
    from bson import ObjectId
except ImportError:
    # Fallback if there's a conflicting bson package
    from pymongo.objectid import ObjectId

# MongoDB Configuration
MONGODB_URI = "mongodb+srv://sujalpawar07:QyUC3cMJAmI4iKRQ@cluster0.3xyu5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
DATABASE_NAME = "vortexa_agriculture"

class DatabaseConfig:
    def __init__(self):
        self.client = None
        self.db = None
    
    def connect(self):
        """Connect to MongoDB"""
        try:
            # Set connection timeout to fail faster
            self.client = MongoClient(
                MONGODB_URI,
                serverSelectionTimeoutMS=5000,  # 5 seconds timeout
                connectTimeoutMS=5000,
                socketTimeoutMS=5000
            )
            self.db = self.client[DATABASE_NAME]
            
            # Test connection
            self.client.admin.command('ping')
            print("✅ Connected to MongoDB successfully")
            return True
        except Exception as e:
            print(f"❌ Failed to connect to MongoDB: {str(e)[:200]}...")
            print("   Server will continue without MongoDB features")
            return False
    
    def get_collection(self, collection_name):
        """Get a collection from the database"""
        if self.db is None:
            raise Exception("Database not connected")
        return self.db[collection_name]
    
    def close_connection(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            print("🔒 MongoDB connection closed")

# Global database instance
db_config = DatabaseConfig()

def init_database():
    """Initialize database connection"""
    return db_config.connect()

def get_db():
    """Get database instance"""
    return db_config.db

def get_collection(collection_name):
    """Get a specific collection"""
    return db_config.get_collection(collection_name)

# Helper function to convert ObjectId to string for JSON serialization
def serialize_doc(doc):
    """Convert MongoDB document to JSON serializable format"""
    if doc is None:
        return None
    
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    
    if isinstance(doc, dict):
        serialized = {}
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                serialized[key] = str(value)
            elif isinstance(value, datetime):
                serialized[key] = value.isoformat()
            elif isinstance(value, dict):
                serialized[key] = serialize_doc(value)
            elif isinstance(value, list):
                serialized[key] = serialize_doc(value)
            else:
                serialized[key] = value
        return serialized
    
    return doc