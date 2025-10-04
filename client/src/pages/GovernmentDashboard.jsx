import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine, faUsers, faBuilding, faClipboardList,
  faMapMarkedAlt, faLeaf, faDatabase, faCog,
  faCalendarAlt, faBell, faDownload, faEye
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';

const GovernmentDashboard = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Placeholder data for government dashboard
  const dashboardStats = [
    {
      title: 'Registered Farmers',
      value: '12,456',
      change: '+8.2%',
      icon: faUsers,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Farm Area',
      value: '45,678 acres',
      change: '+2.1%',
      icon: faMapMarkedAlt,
      color: 'bg-green-500'
    },
    {
      title: 'Subsidies Distributed',
      value: '₹2.3 Cr',
      change: '+15.7%',
      icon: faDatabase,
      color: 'bg-purple-500'
    },
    {
      title: 'Active Schemes',
      value: '24',
      change: '+3',
      icon: faClipboardList,
      color: 'bg-orange-500'
    }
  ];

  const quickActions = [
    {
      title: 'Farmer Registration',
      description: 'View and manage farmer registrations',
      icon: faUsers,
      color: 'bg-blue-500'
    },
    {
      title: 'Scheme Management',
      description: 'Create and manage agricultural schemes',
      icon: faClipboardList,
      color: 'bg-green-500'
    },
    {
      title: 'Subsidy Distribution',
      description: 'Track and approve subsidy payments',
      icon: faDatabase,
      color: 'bg-purple-500'
    },
    {
      title: 'Analytics & Reports',
      description: 'Generate comprehensive reports',
      icon: faChartLine,
      color: 'bg-orange-500'
    },
    {
      title: 'Field Monitoring',
      description: 'Monitor agricultural activities',
      icon: faMapMarkedAlt,
      color: 'bg-indigo-500'
    },
    {
      title: 'Policy Management',
      description: 'Manage agricultural policies',
      icon: faCog,
      color: 'bg-red-500'
    }
  ];

  const recentActivity = [
    'New farmer registration: Rajesh Kumar from Pune',
    '150 subsidy applications approved today',
    'Monsoon preparation scheme launched',
    'Monthly agricultural report generated',
    'Pest control advisory issued for cotton farmers'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Government Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user?.name} | {currentTime.toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
                <FontAwesomeIcon icon={faDownload} className="mr-2" />
                Export Data
              </button>
              <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg">
                <FontAwesomeIcon icon={faBell} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change} this month</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <FontAwesomeIcon icon={stat.icon} className="text-white text-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                <p className="text-gray-600 text-sm mt-1">Manage agricultural administration</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all text-left group"
                    >
                      <div className="flex items-start">
                        <div className={`${action.color} p-2 rounded-lg mr-4 group-hover:scale-110 transition-transform`}>
                          <FontAwesomeIcon icon={action.icon} className="text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {action.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-sm text-gray-600">{activity}</p>
                    </div>
                  ))}
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-4">
                  View all activity
                </button>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Database</span>
                    <span className="text-green-600 text-sm">Online</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">API Services</span>
                    <span className="text-green-600 text-sm">Running</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Backup Status</span>
                    <span className="text-green-600 text-sm">Updated</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Sync</span>
                    <span className="text-gray-600 text-sm">2 mins ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Placeholder Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faBuilding} className="text-blue-500 text-2xl mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Government Dashboard - Coming Soon</h3>
              <p className="text-blue-700 mt-1">
                This dashboard will include comprehensive tools for agricultural administration, 
                farmer management, scheme distribution, and policy implementation. Advanced features 
                are currently under development.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  Farmer Registration Management
                </span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  Subsidy Distribution
                </span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  Policy Implementation
                </span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  Analytics & Reporting
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovernmentDashboard;