import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import GovernmentDashboard from './pages/GovernmentDashboard';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ClimateAnalysis from './pages/ClimateAnalysis';
import FarmConsole from './pages/FarmConsole';
import AIAssistant from './pages/AIAssistant';
import CropManagement from './pages/CropManagement';
import CreateField from './pages/CreateField';
import Fields from './pages/Fields';
import FieldDetail from './pages/FieldDetail';
import FinancialAid from './pages/FinancialAid';
import ClimateDamageClaim from './pages/ClimateDamageClaim';
import WaterManagement from './pages/WaterManagement';
import PlantDiseaseDetection from './pages/PlantDiseaseDetection';
import CropLifecycle from './pages/CropLifecycle';
import CropPrediction from './pages/CropPrediction';
import YieldPrediction from './pages/YieldPrediction';
import IrrigationManagement from './pages/IrrigationManagement';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import VegetationAnalysis from './components/climate/VegetationAnalysis'
import SoilLandAnalysis from './components/climate/SoilLandAnalysis'
import WaterIrrigationAnalysis from './components/climate/WaterIrrigationAnalysis'

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <Routes>
            {/* Public Routes - No authentication required */}
            <Route 
              path="/login" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <Login />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <SignUp />
                </ProtectedRoute>
              } 
            />

            {/* Protected Routes - Authentication required */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Farmer-specific routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute userType="farmer">
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            {/* Government-specific routes */}
            <Route 
              path="/government-dashboard" 
              element={
                <ProtectedRoute userType="government">
                  <Layout>
                    <GovernmentDashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Farmer-specific protected routes */}
            <Route 
              path="/climate" 
              element={
                <ProtectedRoute userType="farmer">
                  <Layout>
                    <ClimateAnalysis />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/farm-console" 
              element={
                <ProtectedRoute userType="farmer">
                  <Layout>
                    <FarmConsole />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/crop-management" 
              element={
                <ProtectedRoute userType="farmer">
                  <Layout>
                    <CropManagement />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/crop-planning" 
              element={
                <ProtectedRoute userType="farmer">
                  <Layout>
                    <CropManagement />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/crop-health" 
              element={
                <ProtectedRoute userType="farmer">
                  <Layout>
                    <CropManagement />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/financial-aid" 
              element={
                <ProtectedRoute userType="farmer">
                  <Layout>
                    <FinancialAid />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/climate-damage-claim" 
              element={
                <ProtectedRoute userType="farmer">
                  <Layout>
                    <ClimateDamageClaim />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/water-management" 
              element={
                <ProtectedRoute userType="farmer">
                  <Layout>
                    <WaterManagement />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/irrigation" 
              element={
                <ProtectedRoute userType="farmer">
                  <Layout>
                    <WaterManagement />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ai-assistant" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <AIAssistant />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/create-field" 
              element={
                <ProtectedRoute userType="farmer">
                  <Layout>
                    <CreateField />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/fields" 
              element={
                <ProtectedRoute userType="farmer">
                  <Layout>
                    <Fields />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/field-list" 
              element={
                <ProtectedRoute userType="farmer">
                  <Layout>
                    <Fields />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/field-detail/:id" 
              element={
                <ProtectedRoute userType="farmer">
                  <Layout>
                    <FieldDetail />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/crop-lifecycle" 
              element={
                <ProtectedRoute userType="farmer">
                  <Layout>
                    <CropLifecycle />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/crop-prediction" 
              element={
                <ProtectedRoute userType="farmer">
                  <Layout>
                    <CropPrediction />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/yield-prediction" 
              element={
                <ProtectedRoute userType="farmer">
                  <Layout>
                    <YieldPrediction />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/irrigation-management" 
              element={
                <ProtectedRoute userType="farmer">
                  <Layout>
                    <IrrigationManagement />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<h1>Page Not Found</h1>} />
          </Routes>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
