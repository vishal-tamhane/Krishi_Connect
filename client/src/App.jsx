import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import ClimateAnalysis from './pages/ClimateAnalysis';
import FarmConsole from './pages/FarmConsole';
import AIAssistant from './pages/AIAssistant';
import CropManagement from './pages/CropManagement';
import CreateField from './pages/CreateField';
import Fields from './pages/Fields';
import FieldDetail from './pages/FieldDetail';
import FinancialAid from './pages/FinancialAid';
import WaterManagement from './pages/WaterManagement';
import PlantDiseaseDetection from './pages/PlantDiseaseDetection';
import CropLifecycle from './pages/CropLifecycle';
import CropPrediction from './pages/CropPrediction';
import YieldPrediction from './pages/YieldPrediction';
import IrrigationManagement from './pages/IrrigationManagement';
import { AppProvider } from './context/AppContext';
import VegetationAnalysis from './components/climate/VegetationAnalysis'
import SoilLandAnalysis from './components/climate/SoilLandAnalysis'
import WaterIrrigationAnalysis from './components/climate/WaterIrrigationAnalysis'

function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/climate" element={<ClimateAnalysis />} />
            <Route path="/farm-console" element={<FarmConsole />} />
            <Route path="/crop-management" element={<CropManagement />} />
            <Route path="/crop-planning" element={<CropManagement />} />
            <Route path="/crop-health" element={<CropManagement />} />
            <Route path="/financial-aid" element={<FinancialAid />} />
            <Route path="/water-management" element={<WaterManagement />} />
            <Route path="/irrigation" element={<WaterManagement />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />            
            <Route path="/create-field" element={<CreateField />} />
            <Route path="/fields" element={<Fields />} />
            <Route path="/field-list" element={<Fields />} />
            <Route path="/field-detail/:id" element={<FieldDetail />} />            
            <Route path="/crop-lifecycle" element={<CropLifecycle />} />
            <Route path="/crop-prediction" element={<CropPrediction />} />
            <Route path="/yield-prediction" element={<YieldPrediction />} />
            <Route path="/irrigation-management" element={<IrrigationManagement />} />
            <Route path="*" element={<h1>Page Not Found</h1>} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}

export default App;
