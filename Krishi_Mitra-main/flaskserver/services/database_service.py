import uuid
from datetime import datetime
from config.database import get_collection, serialize_doc
from models.schemas import (
    FieldMapSchema, 
    CropLifecycleSchema, 
    YieldPredictionSchema, 
    UserSessionSchema
)
try:
    from bson import ObjectId
except ImportError:
    # Fallback if there's a conflicting bson package
    from pymongo.objectid import ObjectId

class FieldMapService:
    """Service for handling field mapping operations"""
    
    def __init__(self):
        self.collection = get_collection('field_maps')
    
    def create_field_map(self, user_id, field_data):
        """Create a new field map"""
        try:
            field_doc = FieldMapSchema.create_field_map(
                user_id=user_id,
                field_name=field_data.get('field_name'),
                coordinates=field_data.get('coordinates'),
                area=field_data.get('area'),
                soil_type=field_data.get('soil_type'),
                elevation=field_data.get('elevation'),
                slope=field_data.get('slope'),
                drainage=field_data.get('drainage'),
                nitrogen=field_data.get('nitrogen'),
                phosphorus=field_data.get('phosphorus'),
                potassium=field_data.get('potassium'),
                ph=field_data.get('ph'),
                organic_matter=field_data.get('organic_matter'),
                moisture=field_data.get('moisture'),
                avg_temperature=field_data.get('avg_temperature'),
                annual_rainfall=field_data.get('annual_rainfall'),
                humidity=field_data.get('humidity')
            )
            
            result = self.collection.insert_one(field_doc)
            field_doc['_id'] = result.inserted_id
            return serialize_doc(field_doc)
        except Exception as e:
            raise Exception(f"Error creating field map: {str(e)}")
    
    def get_field_maps_by_user(self, user_id, limit=50):
        """Get all field maps for a user"""
        try:
            fields = list(self.collection.find(
                {"user_id": user_id, "status": "active"}
            ).sort("created_at", -1).limit(limit))
            return serialize_doc(fields)
        except Exception as e:
            raise Exception(f"Error fetching field maps: {str(e)}")
    
    def get_field_map_by_id(self, field_id):
        """Get a specific field map by ID"""
        try:
            field = self.collection.find_one({"_id": ObjectId(field_id)})
            return serialize_doc(field)
        except Exception as e:
            raise Exception(f"Error fetching field map: {str(e)}")
    
    def update_field_map(self, field_id, update_data):
        """Update a field map"""
        try:
            existing = self.collection.find_one({"_id": ObjectId(field_id)})
            if not existing:
                raise Exception("Field map not found")
            
            update_doc = FieldMapSchema.update_field_map(existing, **update_data)
            
            result = self.collection.update_one(
                {"_id": ObjectId(field_id)},
                {"$set": update_doc}
            )
            
            if result.modified_count > 0:
                updated_field = self.collection.find_one({"_id": ObjectId(field_id)})
                return serialize_doc(updated_field)
            else:
                return serialize_doc(existing)
        except Exception as e:
            raise Exception(f"Error updating field map: {str(e)}")
    
    def delete_field_map(self, field_id):
        """Soft delete a field map"""
        try:
            result = self.collection.update_one(
                {"_id": ObjectId(field_id)},
                {"$set": {"status": "deleted", "updated_at": datetime.utcnow()}}
            )
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Error deleting field map: {str(e)}")

class CropLifecycleService:
    """Service for handling crop lifecycle operations"""
    
    def __init__(self):
        self.collection = get_collection('crop_lifecycle')
    
    def create_crop_lifecycle(self, user_id, lifecycle_data):
        """Create a new crop lifecycle"""
        try:
            lifecycle_doc = CropLifecycleSchema.create_crop_lifecycle(
                user_id=user_id,
                field_id=lifecycle_data.get('field_id'),
                crop_name=lifecycle_data.get('crop_name'),
                sowing_date=lifecycle_data.get('sowing_date'),
                crop_variety=lifecycle_data.get('crop_variety'),
                expected_harvest_date=lifecycle_data.get('expected_harvest_date'),
                nitrogen=lifecycle_data.get('nitrogen'),
                phosphorus=lifecycle_data.get('phosphorus'),
                potassium=lifecycle_data.get('potassium'),
                ph=lifecycle_data.get('ph'),
                temperature=lifecycle_data.get('temperature'),
                humidity=lifecycle_data.get('humidity'),
                rainfall=lifecycle_data.get('rainfall'),
                soil_moisture=lifecycle_data.get('soil_moisture'),
                growth_stages=lifecycle_data.get('growth_stages', []),
                irrigation_schedule=lifecycle_data.get('irrigation_schedule', []),
                fertilizer_schedule=lifecycle_data.get('fertilizer_schedule', []),
                total_irrigation=lifecycle_data.get('total_irrigation', 0),
                irrigation_method=lifecycle_data.get('irrigation_method', 'manual')
            )
            
            result = self.collection.insert_one(lifecycle_doc)
            lifecycle_doc['_id'] = result.inserted_id
            return serialize_doc(lifecycle_doc)
        except Exception as e:
            raise Exception(f"Error creating crop lifecycle: {str(e)}")
    
    def get_crop_lifecycles_by_user(self, user_id, limit=50):
        """Get all crop lifecycles for a user"""
        try:
            lifecycles = list(self.collection.find(
                {"user_id": user_id}
            ).sort("created_at", -1).limit(limit))
            return serialize_doc(lifecycles)
        except Exception as e:
            raise Exception(f"Error fetching crop lifecycles: {str(e)}")
    
    def get_crop_lifecycle_by_id(self, lifecycle_id):
        """Get a specific crop lifecycle by ID"""
        try:
            lifecycle = self.collection.find_one({"_id": ObjectId(lifecycle_id)})
            return serialize_doc(lifecycle)
        except Exception as e:
            raise Exception(f"Error fetching crop lifecycle: {str(e)}")
    
    def get_crop_lifecycles_by_field(self, field_id):
        """Get all crop lifecycles for a specific field"""
        try:
            lifecycles = list(self.collection.find(
                {"field_id": ObjectId(field_id)}
            ).sort("sowing_date", -1))
            return serialize_doc(lifecycles)
        except Exception as e:
            raise Exception(f"Error fetching field crop lifecycles: {str(e)}")
    
    def update_crop_stage(self, lifecycle_id, stage_name, **stage_data):
        """Update current crop stage"""
        try:
            stage_update = CropLifecycleSchema.add_growth_stage_update(
                stage_name=stage_name,
                start_date=stage_data.get('start_date', datetime.utcnow()),
                end_date=stage_data.get('end_date'),
                duration_days=stage_data.get('duration_days'),
                kc_value=stage_data.get('kc_value'),
                notes=stage_data.get('notes')
            )
            
            result = self.collection.update_one(
                {"_id": ObjectId(lifecycle_id)},
                {
                    "$push": {"growth_stages": stage_update},
                    "$set": {
                        "current_stage": stage_name,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Error updating crop stage: {str(e)}")
    
    def add_irrigation_record(self, lifecycle_id, irrigation_data):
        """Add an irrigation record"""
        try:
            irrigation_record = CropLifecycleSchema.add_irrigation_record(
                date=irrigation_data.get('date'),
                amount=irrigation_data.get('amount'),
                method=irrigation_data.get('method', 'manual'),
                notes=irrigation_data.get('notes')
            )
            
            result = self.collection.update_one(
                {"_id": ObjectId(lifecycle_id)},
                {
                    "$push": {"irrigation.schedule": irrigation_record},
                    "$inc": {"irrigation.total_water_used": irrigation_data.get('amount', 0)},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Error adding irrigation record: {str(e)}")
    
    def add_fertilizer_record(self, lifecycle_id, fertilizer_data):
        """Add a fertilizer application record"""
        try:
            fertilizer_record = CropLifecycleSchema.add_fertilizer_record(
                date=fertilizer_data.get('date'),
                nutrient_type=fertilizer_data.get('nutrient_type'),
                amount=fertilizer_data.get('amount'),
                application_method=fertilizer_data.get('application_method'),
                fertilizer_name=fertilizer_data.get('fertilizer_name'),
                notes=fertilizer_data.get('notes')
            )
            
            # Update total nutrients based on type
            update_fields = {
                "$push": {"fertilizer.schedule": fertilizer_record},
                "$set": {"updated_at": datetime.utcnow()}
            }
            
            nutrient_type = fertilizer_data.get('nutrient_type', '').upper()
            amount = fertilizer_data.get('amount', 0)
            
            if nutrient_type == 'N':
                update_fields["$inc"] = {"fertilizer.total_nitrogen": amount}
            elif nutrient_type == 'P':
                update_fields["$inc"] = {"fertilizer.total_phosphorus": amount}
            elif nutrient_type == 'K':
                update_fields["$inc"] = {"fertilizer.total_potassium": amount}
            
            result = self.collection.update_one(
                {"_id": ObjectId(lifecycle_id)},
                update_fields
            )
            
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Error adding fertilizer record: {str(e)}")

class YieldPredictionService:
    """Service for handling yield prediction operations"""
    
    def __init__(self):
        self.collection = get_collection('yield_predictions')
    
    def create_yield_prediction(self, user_id, prediction_data):
        """Create a new yield prediction"""
        try:
            prediction_doc = YieldPredictionSchema.create_yield_prediction(
                user_id=user_id,
                field_id=prediction_data.get('field_id'),
                crop_lifecycle_id=prediction_data.get('crop_lifecycle_id'),
                crop_name=prediction_data.get('crop_name'),
                field_area=prediction_data.get('field_area'),
                sowing_date=prediction_data.get('sowing_date'),
                current_stage=prediction_data.get('current_stage'),
                days_after_sowing=prediction_data.get('days_after_sowing'),
                nitrogen=prediction_data.get('nitrogen'),
                phosphorus=prediction_data.get('phosphorus'),
                potassium=prediction_data.get('potassium'),
                ph=prediction_data.get('ph'),
                soil_moisture=prediction_data.get('soil_moisture'),
                temperature=prediction_data.get('temperature'),
                humidity=prediction_data.get('humidity'),
                rainfall=prediction_data.get('rainfall'),
                irrigation_total=prediction_data.get('irrigation_total'),
                fertilizer_applied=prediction_data.get('fertilizer_applied'),
                pest_disease_pressure=prediction_data.get('pest_disease_pressure', 'low'),
                expected_yield=prediction_data.get('expected_yield'),
                total_yield=prediction_data.get('total_yield'),
                quality_grade=prediction_data.get('quality_grade'),
                predicted_harvest_date=prediction_data.get('predicted_harvest_date'),
                confidence_score=prediction_data.get('confidence_score'),
                risk_factors=prediction_data.get('risk_factors', []),
                recommendations=prediction_data.get('recommendations', []),
                model_version=prediction_data.get('model_version', '1.0'),
                prediction_method=prediction_data.get('prediction_method', 'ml_model'),
                features_used=prediction_data.get('features_used', [])
            )
            
            result = self.collection.insert_one(prediction_doc)
            prediction_doc['_id'] = result.inserted_id
            return serialize_doc(prediction_doc)
        except Exception as e:
            raise Exception(f"Error creating yield prediction: {str(e)}")
    
    def get_yield_predictions_by_user(self, user_id, limit=50):
        """Get all yield predictions for a user"""
        try:
            predictions = list(self.collection.find(
                {"user_id": user_id}
            ).sort("prediction_date", -1).limit(limit))
            return serialize_doc(predictions)
        except Exception as e:
            raise Exception(f"Error fetching yield predictions: {str(e)}")
    
    def get_yield_prediction_by_id(self, prediction_id):
        """Get a specific yield prediction by ID"""
        try:
            prediction = self.collection.find_one({"_id": ObjectId(prediction_id)})
            return serialize_doc(prediction)
        except Exception as e:
            raise Exception(f"Error fetching yield prediction: {str(e)}")
    
    def update_actual_results(self, prediction_id, actual_yield, actual_harvest_date, quality_achieved):
        """Update prediction with actual harvest results"""
        try:
            update_data = YieldPredictionSchema.update_actual_results(
                actual_yield, actual_harvest_date, quality_achieved
            )
            
            result = self.collection.update_one(
                {"_id": ObjectId(prediction_id)},
                {"$set": update_data}
            )
            
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Error updating actual results: {str(e)}")

class UserSessionService:
    """Service for handling user sessions"""
    
    def __init__(self):
        self.collection = get_collection('user_sessions')
    
    def create_or_get_session(self, ip_address, user_agent=None):
        """Create or get existing session for IP address"""
        try:
            # Try to find existing session for this IP
            existing_session = self.collection.find_one({"ip_address": ip_address})
            
            if existing_session:
                # Update last activity
                self.collection.update_one(
                    {"_id": existing_session["_id"]},
                    {"$set": {"last_active": datetime.utcnow()}}
                )
                return serialize_doc(existing_session)
            else:
                # Create new session
                session_id = str(uuid.uuid4())
                session_doc = UserSessionSchema.create_user_session(
                    session_id=session_id,
                    ip_address=ip_address,
                    user_agent=user_agent
                )
                
                result = self.collection.insert_one(session_doc)
                session_doc['_id'] = result.inserted_id
                return serialize_doc(session_doc)
        except Exception as e:
            raise Exception(f"Error managing user session: {str(e)}")
    
    def update_session_stats(self, session_id, stat_type):
        """Update session statistics"""
        try:
            stat_field = f"{stat_type}_count"
            result = self.collection.update_one(
                {"session_id": session_id},
                {
                    "$inc": {stat_field: 1},
                    "$set": {"last_active": datetime.utcnow()}
                }
            )
            return result.modified_count > 0
        except Exception as e:
            raise Exception(f"Error updating session stats: {str(e)}")

# Utility function to get user session ID from request
def get_user_session_id(request):
    """Get or create user session ID from request"""
    try:
        ip_address = request.remote_addr or request.environ.get('HTTP_X_FORWARDED_FOR', 'unknown')
        user_agent = request.headers.get('User-Agent')
        
        session_service = UserSessionService()
        session = session_service.create_or_get_session(ip_address, user_agent)
        
        return session.get('session_id')
    except Exception as e:
        # Fallback to IP address if session creation fails
        return request.remote_addr or 'anonymous'