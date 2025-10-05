# Flask App with PostgreSQL Integration
# Updated from MongoDB to PostgreSQL Implementation

from flask import Flask, request, jsonify, session
from flask_cors import CORS
import traceback
import logging
from datetime import datetime, timedelta
import jwt
import os
from functools import wraps

# Import PostgreSQL services
try:
    from postgresql_implementation import get_postgresql_services, init_postgresql_database
    POSTGRESQL_AVAILABLE = True
except ImportError as e:
    print(f"PostgreSQL services not available: {e}")
    print("Please install required packages: pip install psycopg2-binary")
    POSTGRESQL_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

# Initialize PostgreSQL services
if POSTGRESQL_AVAILABLE:
    services = get_postgresql_services()
    user_service = services['user_service']
    field_service = services['field_service']
    crop_service = services['crop_service']
    climate_claim_service = services['climate_claim_service']
    db_config = services['db_config']
else:
    # Fallback to prevent app crash
    user_service = None
    field_service = None
    crop_service = None
    climate_claim_service = None
    db_config = None

# ================================================================
# Authentication Middleware
# ================================================================

def jwt_required(f):
    """Decorator to require JWT authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'NO_TOKEN',
                    'message': 'Token is missing'
                }
            }), 401
        
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
            
            # Decode JWT token
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user_id = data['user_id']
            current_user_type = data['user_type']
            
            # Add user info to request context
            request.current_user_id = current_user_id
            request.current_user_type = current_user_type
            
        except jwt.ExpiredSignatureError:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'TOKEN_EXPIRED',
                    'message': 'Token has expired'
                }
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'INVALID_TOKEN',
                    'message': 'Token is invalid'
                }
            }), 401
        
        return f(*args, **kwargs)
    
    return decorated

def generate_jwt_token(user_id, user_type):
    """Generate JWT token for user"""
    payload = {
        'user_id': user_id,
        'user_type': user_type,
        'exp': datetime.utcnow() + timedelta(days=7),  # Token expires in 7 days
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

# ================================================================
# Error Handlers
# ================================================================

@app.errorhandler(Exception)
def handle_exception(e):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(e)}")
    logger.error(traceback.format_exc())
    
    return jsonify({
        'success': False,
        'error': {
            'code': 'SERVER_ERROR',
            'message': 'An unexpected error occurred',
            'details': str(e) if app.debug else None
        }
    }), 500

def create_error_response(code, message, status_code=400, details=None):
    """Create standardized error response"""
    return jsonify({
        'success': False,
        'error': {
            'code': code,
            'message': message,
            'details': details,
            'timestamp': datetime.utcnow().isoformat()
        }
    }), status_code

def create_success_response(data=None, message=None):
    """Create standardized success response"""
    response = {
        'success': True,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    if data is not None:
        response['data'] = data
    if message:
        response['message'] = message
        
    return jsonify(response)

# ================================================================
# Health Check
# ================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        if not POSTGRESQL_AVAILABLE:
            return create_error_response(
                'SERVICE_UNAVAILABLE',
                'PostgreSQL services not available',
                503
            )
        
        # Test database connection
        if db_config and db_config.is_connected:
            return create_success_response({
                'status': 'healthy',
                'database': 'connected',
                'service': 'krishi_connect_postgresql',
                'version': '2.0'
            })
        else:
            return create_error_response(
                'DB_CONNECTION_FAILED',
                'Database connection failed',
                503
            )
            
    except Exception as e:
        return create_error_response(
            'HEALTH_CHECK_FAILED',
            f'Health check failed: {str(e)}',
            503
        )

# ================================================================
# Authentication Routes
# ================================================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """User registration endpoint"""
    try:
        if not POSTGRESQL_AVAILABLE:
            return create_error_response('SERVICE_UNAVAILABLE', 'PostgreSQL services not available', 503)
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'name', 'user_type']
        for field in required_fields:
            if not data.get(field):
                return create_error_response('MISSING_FIELD', f'{field} is required')
        
        # Validate user type
        if data['user_type'] not in ['farmer', 'government']:
            return create_error_response('INVALID_USER_TYPE', 'User type must be farmer or government')
        
        # Create user
        user = user_service.create_user(
            email=data['email'],
            password=data['password'],
            name=data['name'],
            phone=data.get('phone'),
            user_type=data['user_type'],
            location=data.get('location')
        )
        
        # Generate JWT token
        token = generate_jwt_token(user['id'], user['user_type'])
        
        return create_success_response({
            'user': user,
            'token': token
        })
        
    except Exception as e:
        if "Email already exists" in str(e):
            return create_error_response('EMAIL_EXISTS', 'Email already registered', 409)
        
        logger.error(f"Registration error: {str(e)}")
        return create_error_response('REGISTRATION_FAILED', str(e), 500)

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        if not POSTGRESQL_AVAILABLE:
            return create_error_response('SERVICE_UNAVAILABLE', 'PostgreSQL services not available', 503)
        
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return create_error_response('MISSING_CREDENTIALS', 'Email and password are required')
        
        # Authenticate user
        user = user_service.authenticate_user(data['email'], data['password'])
        
        if not user:
            return create_error_response('INVALID_CREDENTIALS', 'Invalid email or password', 401)
        
        # Check user type if specified
        if data.get('user_type') and user['user_type'] != data['user_type']:
            return create_error_response('USER_TYPE_MISMATCH', 'User type does not match', 403)
        
        # Generate JWT token
        token = generate_jwt_token(user['id'], user['user_type'])
        
        return create_success_response({
            'user': user,
            'token': token
        })
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return create_error_response('LOGIN_FAILED', str(e), 500)

# ================================================================
# Field Management Routes
# ================================================================

@app.route('/api/fields', methods=['POST'])
@jwt_required
def create_field():
    """Create a new field"""
    try:
        if not POSTGRESQL_AVAILABLE:
            return create_error_response('SERVICE_UNAVAILABLE', 'PostgreSQL services not available', 503)
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['field_name', 'coordinates', 'area_hectares']
        for field in required_fields:
            if not data.get(field):
                return create_error_response('MISSING_FIELD', f'{field} is required')
        
        # Create field
        field = field_service.create_field(request.current_user_id, data)
        
        return create_success_response(field, 'Field created successfully')
        
    except Exception as e:
        logger.error(f"Create field error: {str(e)}")
        return create_error_response('CREATE_FIELD_FAILED', str(e), 500)

@app.route('/api/fields', methods=['GET'])
@jwt_required
def get_fields():
    """Get all fields for current user"""
    try:
        if not POSTGRESQL_AVAILABLE:
            return create_error_response('SERVICE_UNAVAILABLE', 'PostgreSQL services not available', 503)
        
        limit = int(request.args.get('limit', 50))
        fields = field_service.get_user_fields(request.current_user_id, limit)
        
        return create_success_response({'fields': fields})
        
    except Exception as e:
        logger.error(f"Get fields error: {str(e)}")
        return create_error_response('GET_FIELDS_FAILED', str(e), 500)

# ================================================================
# Crop Management Routes
# ================================================================

@app.route('/api/crops', methods=['POST'])
@jwt_required
def create_crop():
    """Create a new crop lifecycle"""
    try:
        if not POSTGRESQL_AVAILABLE:
            return create_error_response('SERVICE_UNAVAILABLE', 'PostgreSQL services not available', 503)
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['field_id', 'crop_name', 'sowing_date']
        for field in required_fields:
            if not data.get(field):
                return create_error_response('MISSING_FIELD', f'{field} is required')
        
        # Create crop lifecycle
        crop = crop_service.create_crop_lifecycle(request.current_user_id, data)
        
        return create_success_response(crop, 'Crop lifecycle created successfully')
        
    except Exception as e:
        logger.error(f"Create crop error: {str(e)}")
        return create_error_response('CREATE_CROP_FAILED', str(e), 500)

@app.route('/api/crops/<crop_id>/irrigation', methods=['POST'])
@jwt_required
def add_irrigation_record(crop_id):
    """Add irrigation record to crop"""
    try:
        if not POSTGRESQL_AVAILABLE:
            return create_error_response('SERVICE_UNAVAILABLE', 'PostgreSQL services not available', 503)
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['irrigation_date', 'amount_mm']
        for field in required_fields:
            if not data.get(field):
                return create_error_response('MISSING_FIELD', f'{field} is required')
        
        # Add irrigation record
        record_id = crop_service.add_irrigation_record(crop_id, data)
        
        return create_success_response({
            'irrigation_record_id': record_id
        }, 'Irrigation record added successfully')
        
    except Exception as e:
        logger.error(f"Add irrigation error: {str(e)}")
        return create_error_response('ADD_IRRIGATION_FAILED', str(e), 500)

# ================================================================
# Climate Damage Claim Routes
# ================================================================

@app.route('/api/climate-damage-claims', methods=['POST'])
@jwt_required
def create_climate_claim():
    """Create a new climate damage claim"""
    try:
        if not POSTGRESQL_AVAILABLE:
            return create_error_response('SERVICE_UNAVAILABLE', 'PostgreSQL services not available', 503)
        
        # Only farmers can create claims
        if request.current_user_type != 'farmer':
            return create_error_response('UNAUTHORIZED', 'Only farmers can create climate damage claims', 403)
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = [
            'farmer_name', 'farmer_email', 'farmer_phone', 'farm_location',
            'farmer_address', 'incident_date', 'damage_type', 'crop_type',
            'affected_area_hectares', 'estimated_loss_amount', 'severity_level',
            'damage_description'
        ]
        
        for field in required_fields:
            if not data.get(field):
                return create_error_response('MISSING_FIELD', f'{field} is required')
        
        # Create climate damage claim
        claim = climate_claim_service.create_climate_claim(request.current_user_id, data)
        
        return create_success_response(claim, 'Climate damage claim submitted successfully')
        
    except Exception as e:
        logger.error(f"Create climate claim error: {str(e)}")
        return create_error_response('CREATE_CLAIM_FAILED', str(e), 500)

# ================================================================
# Government Schemes Routes
# ================================================================

@app.route('/api/government-schemes', methods=['GET'])
def get_government_schemes():
    """Get government schemes (public endpoint for scheme search)"""
    try:
        if not POSTGRESQL_AVAILABLE:
            return create_error_response('SERVICE_UNAVAILABLE', 'PostgreSQL services not available', 503)
        
        # Mock response for now - would be implemented with actual database query
        schemes = [
            {
                "id": "PMFBY",
                "name": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
                "description": "Comprehensive crop insurance for weather-related losses",
                "max_amount": "₹2,00,000",
                "eligibility": "All farmers growing notified crops"
            },
            {
                "id": "WBCIS",
                "name": "Weather Based Crop Insurance Scheme (WBCIS)",
                "description": "Insurance based on weather parameters",
                "max_amount": "₹1,50,000",
                "eligibility": "Farmers affected by adverse weather"
            },
            {
                "id": "NAIS",
                "name": "National Agricultural Insurance Scheme (NAIS)",
                "description": "Basic crop insurance for natural calamities",
                "max_amount": "₹1,00,000",
                "eligibility": "Small and marginal farmers"
            }
        ]
        
        # Filter by search query if provided
        search_query = request.args.get('search', '').lower()
        if search_query:
            schemes = [
                scheme for scheme in schemes
                if search_query in scheme['name'].lower() or search_query in scheme['description'].lower()
            ]
        
        return create_success_response({'schemes': schemes})
        
    except Exception as e:
        logger.error(f"Get schemes error: {str(e)}")
        return create_error_response('GET_SCHEMES_FAILED', str(e), 500)

# ================================================================
# Dashboard Routes
# ================================================================

@app.route('/api/dashboard/farmer-summary', methods=['GET'])
@jwt_required
def get_farmer_dashboard():
    """Get farmer dashboard summary"""
    try:
        if not POSTGRESQL_AVAILABLE:
            return create_error_response('SERVICE_UNAVAILABLE', 'PostgreSQL services not available', 503)
        
        if request.current_user_type != 'farmer':
            return create_error_response('UNAUTHORIZED', 'Only farmers can access farmer dashboard', 403)
        
        # Mock dashboard data - would be implemented with actual database queries
        dashboard_data = {
            'total_fields': 3,
            'active_crops': 5,
            'total_predictions': 12,
            'pending_claims': 2,
            'recent_crops': [
                {
                    'crop_name': 'Wheat',
                    'current_stage': 'flowering',
                    'sowing_date': '2025-11-15',
                    'days_since_sowing': 45
                }
            ],
            'weather_alerts': [],
            'upcoming_tasks': [
                'Fertilizer application due for North Field',
                'Irrigation scheduled for tomorrow'
            ]
        }
        
        return create_success_response(dashboard_data)
        
    except Exception as e:
        logger.error(f"Dashboard error: {str(e)}")
        return create_error_response('DASHBOARD_FAILED', str(e), 500)

# ================================================================
# Test Routes (Development Only)
# ================================================================

@app.route('/api/test/db-connection', methods=['GET'])
def test_db_connection():
    """Test database connection (development only)"""
    try:
        if not POSTGRESQL_AVAILABLE:
            return create_error_response('SERVICE_UNAVAILABLE', 'PostgreSQL services not available', 503)
        
        if db_config and db_config.is_connected:
            return create_success_response({
                'database': 'PostgreSQL',
                'status': 'connected',
                'message': 'Database connection successful'
            })
        else:
            return create_error_response('DB_CONNECTION_FAILED', 'Database connection failed', 500)
            
    except Exception as e:
        return create_error_response('DB_TEST_FAILED', str(e), 500)

# ================================================================
# Main Application
# ================================================================

if __name__ == '__main__':
    print("="*80)
    print("KRISHI CONNECT - POSTGRESQL BACKEND SERVER")
    print("="*80)
    
    if not POSTGRESQL_AVAILABLE:
        print("❌ PostgreSQL services not available!")
        print("Please install required packages:")
        print("pip install psycopg2-binary")
        print("\nSet up your PostgreSQL database and update environment variables:")
        print("DB_HOST=localhost")
        print("DB_PORT=5432")
        print("DB_NAME=krishi_connect")
        print("DB_USER=postgres")
        print("DB_PASSWORD=your_password")
        print("="*80)
        exit(1)
    
    # Initialize database
    print("Initializing PostgreSQL database...")
    if init_postgresql_database():
        print("✅ Database initialized successfully!")
        print("\nStarting Flask server...")
        print("Server will be available at: http://127.0.0.1:5002")
        print("Health check: http://127.0.0.1:5002/health")
        print("API documentation: Check postgresql_implementation.py for complete data flow")
        print("="*80)
        
        # Run Flask app
        app.run(host='0.0.0.0', port=5002, debug=True)
    else:
        print("❌ Failed to initialize database!")
        print("Please check your PostgreSQL connection and try again.")
        exit(1)