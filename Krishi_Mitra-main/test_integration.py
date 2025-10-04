"""
Test script to verify the crop lifecycle prediction integration
"""
import requests
import json
from datetime import datetime, timedelta

# Test configuration
FLASK_URL = "http://localhost:5002"
TEST_CROP = "Maize"
TEST_DATE = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')

def test_flask_server():
    """Test if Flask server is running"""
    try:
        response = requests.get(f"{FLASK_URL}/")
        print(f"Flask server status: {response.status_code}")
        print(f"Response: {response.json()}")
        return True
    except Exception as e:
        print(f"Flask server not accessible: {e}")
        return False

def test_crop_prediction():
    """Test the crop prediction endpoint"""
    try:
        payload = {
            "crop_type": TEST_CROP,
            "sowing_date": TEST_DATE
        }
        
        print(f"\nTesting crop prediction with:")
        print(f"Crop: {TEST_CROP}")
        print(f"Sowing Date: {TEST_DATE}")
        
        response = requests.post(f"{FLASK_URL}/predict-crop-cycle", 
                               json=payload,
                               headers={'Content-Type': 'application/json'})
        
        print(f"\nResponse Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Prediction successful!")
            print(f"Harvest Date: {result.get('harvest_date', 'N/A')}")
            print(f"Total Duration: {result.get('total_duration', 'N/A')} days")
            print(f"Number of growth stages: {len(result.get('timeline', []))}")
            print(f"Irrigation schedule entries: {len(result.get('irrigation_schedule', []))}")
            return True
        else:
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"Error testing crop prediction: {e}")
        return False

if __name__ == "__main__":
    print("Testing Crop Lifecycle Integration")
    print("=" * 50)
    
    # Test Flask server
    if test_flask_server():
        print("\n" + "=" * 50)
        test_crop_prediction()
    
    print("\n" + "=" * 50)
    print("Test completed!")