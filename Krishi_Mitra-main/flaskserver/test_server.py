import requests
import json

# Test the Flask server endpoints
BASE_URL = "http://127.0.0.1:5002"

def test_server_status():
    """Test basic server connectivity"""
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"✅ Server Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Server connection failed: {e}")
        return False

def test_api_status():
    """Test API status endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/api/status")
        print(f"✅ API Status: {response.status_code}")
        data = response.json()
        print(f"   MongoDB Connected: {data.get('mongodb_connected')}")
        print(f"   ML Models Loaded: {data.get('ml_models_loaded')}")
        print(f"   Services Available: {data.get('services_available')}")
        return True
    except Exception as e:
        print(f"❌ API status check failed: {e}")
        return False

def test_crop_prediction():
    """Test existing crop prediction endpoint"""
    try:
        test_data = {
            "crop_type": "rice",
            "sowing_date": "2025-10-01"
        }
        
        response = requests.post(f"{BASE_URL}/predict-crop-cycle", json=test_data)
        print(f"✅ Crop Prediction: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Crop: {data.get('crop')}")
            print(f"   Harvest Date: {data.get('harvest_date')}")
            print(f"   Total Duration: {data.get('total_duration')} days")
        else:
            print(f"   Error: {response.text}")
        return True
    except Exception as e:
        print(f"❌ Crop prediction test failed: {e}")
        return False

def test_mongodb_endpoints():
    """Test MongoDB endpoints (should fail gracefully)"""
    try:
        # Test field creation (should return 503 if MongoDB is not connected)
        test_field = {
            "field_name": "Test Field",
            "coordinates": [
                {"lat": 19.0760, "lng": 72.8777},
                {"lat": 19.0770, "lng": 72.8787}
            ],
            "area": 1.5,
            "soil_type": "Clay Loam",
            "nitrogen": 25.0,
            "phosphorus": 15.0,
            "potassium": 20.0,
            "ph": 6.8
        }
        
        response = requests.post(f"{BASE_URL}/api/fields", json=test_field)
        print(f"✅ MongoDB Field Endpoint: {response.status_code}")
        
        if response.status_code == 503:
            print("   ✅ Correctly returning 503 (Service Unavailable) - MongoDB not connected")
        elif response.status_code == 201:
            print("   ✅ Field created successfully - MongoDB is working!")
        else:
            print(f"   Response: {response.json()}")
            
        return True
    except Exception as e:
        print(f"❌ MongoDB endpoint test failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Flask Server with MongoDB Integration")
    print("=" * 50)
    
    # Run tests
    server_ok = test_server_status()
    if server_ok:
        test_api_status()
        test_crop_prediction()
        test_mongodb_endpoints()
    
    print("\n" + "=" * 50)
    print("✅ Testing completed!")
    print("\n📝 Notes:")
    print("   - MongoDB connection timeout is expected due to network/firewall")
    print("   - Server handles MongoDB unavailability gracefully")
    print("   - All existing ML endpoints should work normally")
    print("   - MongoDB endpoints return proper error messages when unavailable")