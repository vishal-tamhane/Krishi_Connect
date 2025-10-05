import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MdDashboard } from "react-icons/md";
import { MdOutlineStorage } from "react-icons/md";
import { MdStorage } from "react-icons/md";
import { 
  faTractor, 
  faDatabase, 
  faArrowRightFromBracket,
  faLayerGroup,
  faChartLine,
  faLeaf,
  faCloudSunRain,
  faDroplet,
  faCog,
  faAngleRight,
  faAngleDown,
  faUser,
  faUserGear,
  faChevronLeft,
  faChevronRight,
  faRobot,
  faHome,
  faChartArea,
  faWater,
  faSeedling,
  faCloudRain,
  faWarning,
  faSprayCan,
  faWheatAwn,
  faPlantWilt,
  faMap,
  faDraftingCompass,
  faLocationDot,
  faHandshake,
  faRupeeSign,
  faWarehouse,
  faMicroscope,
  faThermometerHalf,
  faEye,
  faCalendarCheck,
  faCalculator,
  faBell,
  faHandHoldingDollar,
  faGraduationCap,
  faLifeRing,
  faChartPie,
  faCloudShowersHeavy,
  faMapMarkedAlt,
  faSearchDollar,
  faFileInvoiceDollar
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isSidebarOpen, isCollapsed, toggleSidebar }) => {
  const location = useLocation();
  const { user, isFarmer } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState({
    analytics: false,
    pests: false,
    crops: false,
    irrigation: false,
    fields: false,
    financialAid: false,
    climate: false
  });
  
  // Detect screen size for responsive behavior
  const [screenSize, setScreenSize] = useState({
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setScreenSize({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024
      });
    };

    // Add debouncing to prevent excessive re-renders
    let timeoutId;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const toggleMenu = (menu) => {
    // Don't expand menus if sidebar is collapsed on desktop
    if (screenSize.isDesktop && isCollapsed) {
      toggleSidebar(); // Expand the sidebar first
      return;
    }
    
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };
  
  // Handle keyboard navigation for accessibility
  const handleKeyDown = (e, menu) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleMenu(menu);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Handler to collapse sidebar on link click for mobile devices
const handleLinkClick = useCallback(() => {
  if ((screenSize.isMobile || screenSize.isTablet) && isSidebarOpen) {
    toggleSidebar(); // Collapse sidebar on mobile and tablet screens
  }
}, [screenSize.isMobile, screenSize.isTablet, isSidebarOpen, toggleSidebar]);

// Attach the click handler to sidebar links using event delegation
useEffect(() => {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  function onLinkClick(event) {
    // Only trigger when clicking on internal <Link> anchors
    if (event.target.closest('a')) {
      handleLinkClick();
    }
  }

  sidebar.addEventListener('click', onLinkClick);
  return () => sidebar.removeEventListener('click', onLinkClick);
}, [handleLinkClick]);


  return (
    <aside 
      id="sidebar"
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out bg-white border-r border-blue-200 shadow-xl ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } ${
        screenSize.isMobile 
          ? 'w-[85vw] max-w-[280px]' 
          : screenSize.isTablet 
            ? (isCollapsed ? 'w-20' : 'w-64') 
            : (isCollapsed ? 'w-20' : 'w-64')
      }` }
      aria-label="Sidebar"
    >
      <div className="h-full flex flex-col justify-between overflow-y-auto pb-20 md:pb-0 overscroll-contain scroll-smooth scrollbar-none">
        <div>
          {/* Top section with logo & collapse button */}
          <div className="flex items-center justify-between py-3 px-3 md:py-4 md:px-4 border-b border-blue-200 sticky top-0 bg-blue-600 z-10 shadow-md">
            {!isCollapsed && (
              <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                <div className="w-7 h-7 md:w-8 md:h-8 bg-white rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                  <FontAwesomeIcon icon={faLeaf} className="text-blue-600 text-base md:text-lg" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-white text-lg md:text-xl truncate">Krishi Mitra</span>
                  <span className="text-xs text-blue-100 hidden sm:block">Smart Farming Assistant</span>
                </div>
              </div>
            )}
            
            {/* Toggle button */}
            <button 
              onClick={toggleSidebar} 
              type="button" 
              className={`${isCollapsed ? 'mx-auto' : 'ml-2'} inline-flex items-center justify-center p-2 rounded-lg text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 flex-shrink-0`}
              aria-expanded={!isCollapsed}
              aria-label="Toggle sidebar collapse"
            >
              <FontAwesomeIcon icon={isCollapsed ? faChevronRight : faChevronLeft} className="w-3 h-3 md:w-4 md:h-4" />
              <span className="sr-only">Toggle sidebar</span>
            </button>
          </div>
          
          {/* Navigation Links */}
          <nav className={`${screenSize.isMobile ? 'mt-3 px-2' : screenSize.isTablet ? 'mt-3 px-3' : 'mt-4 px-4'}`}>
            {/* Main Dashboard */}
            <div className={screenSize.isMobile ? 'mb-3' : 'mb-4'}>
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2 px-2">
                  Main
                </h3>
              )}
              <ul className={screenSize.isMobile ? 'space-y-1' : 'space-y-1.5'}>
                <li>
                  <Link
                    to="/"
                    className={`flex items-center rounded-lg ${isCollapsed ? 'justify-center' : ''} ${
                      isActive('/') 
                        ? 'bg-blue-500 text-white font-medium shadow-sm' 
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                    } group transition-all duration-200 touch-manipulation ${
                      screenSize.isMobile 
                        ? 'px-2 py-3 min-h-[44px]' 
                        : screenSize.isTablet 
                          ? 'px-3 py-2.5' 
                          : 'px-3 py-2.5'
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={faHome}
                      className={`${
                        screenSize.isMobile ? 'w-4 h-4' : 'w-5 h-5'
                      } ${isActive('/') ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`}
                    />
                    {!isCollapsed && (
                      <span className={`whitespace-nowrap ${
                        screenSize.isMobile ? 'ml-2 text-sm' : 'ml-3 text-base'
                      }`}>
                        Dashboard
                      </span>
                    )}
                  </Link>
                </li>
              </ul>
            </div>
            {/* Field Management */}
            <div className={screenSize.isMobile ? 'mb-3' : 'mb-4'}>
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2 px-2">
                  Field Management
                </h3>
              )}
              <ul className={screenSize.isMobile ? 'space-y-1' : 'space-y-1.5'}>
                <li>
                  <Link
                    to="/create-field"
                    className={`flex items-center rounded-lg ${isCollapsed ? 'justify-center' : ''} ${
                      isActive('/create-field') 
                        ? 'bg-blue-500 text-white font-medium shadow-sm' 
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                    } group transition-all duration-200 touch-manipulation ${
                      screenSize.isMobile 
                        ? 'px-2 py-3 min-h-[44px]' 
                        : screenSize.isTablet 
                          ? 'px-3 py-2.5' 
                          : 'px-3 py-2.5'
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={faDraftingCompass}
                      className={`${
                        screenSize.isMobile ? 'w-4 h-4' : 'w-5 h-5'
                      } ${isActive('/create-field') ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`}
                    />
                    {!isCollapsed && (
                      <span className={`whitespace-nowrap ${
                        screenSize.isMobile ? 'ml-2 text-sm' : 'ml-3 text-base'
                      }`}>
                        Create New Field
                      </span>
                    )}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/fields"
                    className={`flex items-center rounded-lg ${isCollapsed ? 'justify-center' : ''} ${
                      isActive('/fields') 
                        ? 'bg-blue-500 text-white font-medium shadow-sm' 
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                    } group transition-all duration-200 touch-manipulation ${
                      screenSize.isMobile 
                        ? 'px-2 py-3 min-h-[44px]' 
                        : screenSize.isTablet 
                          ? 'px-3 py-2.5' 
                          : 'px-3 py-2.5'
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={faMap}
                      className={`${
                        screenSize.isMobile ? 'w-4 h-4' : 'w-5 h-5'
                      } ${isActive('/fields') ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`}
                    />
                    {!isCollapsed && (
                      <span className={`whitespace-nowrap ${
                        screenSize.isMobile ? 'ml-2 text-sm' : 'ml-3 text-base'
                      }`}>
                        Manage Fields
                      </span>
                    )}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Crop Management */}
            <div className="mb-4">
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2 px-2">
                  Crop Management
                </h3>
              )}
              <ul className="space-y-1">
                <li>
                  <Link
                    to="/crop-lifecycle"
                    className={`flex items-center px-2 md:px-3 py-2 md:py-2.5 rounded-lg ${isCollapsed ? 'justify-center' : ''} ${
                      isActive('/crop-lifecycle') 
                        ? 'bg-blue-500 text-white font-medium shadow-sm' 
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                    } group transition-all duration-200 touch-manipulation`}
                  >
                    <FontAwesomeIcon
                      icon={faSeedling}
                      className={`w-4 h-4 md:w-5 md:h-5 ${isActive('/crop-lifecycle') ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`}
                    />
                    {!isCollapsed && <span className="ml-2 md:ml-3 whitespace-nowrap text-sm md:text-base">Crop Lifecycle</span>}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/crop-prediction"
                    className={`flex items-center px-2 md:px-3 py-2 md:py-2.5 rounded-lg ${isCollapsed ? 'justify-center' : ''} ${
                      isActive('/crop-prediction') 
                        ? 'bg-blue-500 text-white font-medium shadow-sm' 
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                    } group transition-all duration-200 touch-manipulation`}
                  >
                    <FontAwesomeIcon
                      icon={faChartLine}
                      className={`w-4 h-4 md:w-5 md:h-5 ${isActive('/crop-prediction') ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`}
                    />
                    {!isCollapsed && <span className="ml-2 md:ml-3 whitespace-nowrap text-sm md:text-base">Crop Prediction</span>}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/yield-prediction"
                    className={`flex items-center px-2 md:px-3 py-2 md:py-2.5 rounded-lg ${isCollapsed ? 'justify-center' : ''} ${
                      isActive('/yield-prediction') 
                        ? 'bg-blue-500 text-white font-medium shadow-sm' 
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                    } group transition-all duration-200 touch-manipulation`}
                  >
                    <FontAwesomeIcon
                      icon={faWheatAwn}
                      className={`w-4 h-4 md:w-5 md:h-5 ${isActive('/yield-prediction') ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`}
                    />
                    {!isCollapsed && <span className="ml-2 md:ml-3 whitespace-nowrap text-sm md:text-base">Yield Prediction</span>}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/irrigation-management"
                    className={`flex items-center px-2 md:px-3 py-2 md:py-2.5 rounded-lg ${isCollapsed ? 'justify-center' : ''} ${
                      isActive('/irrigation-management') 
                        ? 'bg-blue-500 text-white font-medium shadow-sm' 
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                    } group transition-all duration-200 touch-manipulation`}
                  >
                    <FontAwesomeIcon
                      icon={faDroplet}
                      className={`w-4 h-4 md:w-5 md:h-5 ${isActive('/irrigation-management') ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`}
                    />
                    {!isCollapsed && <span className="ml-2 md:ml-3 whitespace-nowrap text-sm md:text-base">Irrigation Management</span>}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Financial Aid - Only for Farmers */}
            {isFarmer && (
              <div className="mb-4">
                {!isCollapsed && (
                  <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2 px-2">
                    Financial Aid
                  </h3>
                )}
                <ul className="space-y-1">
                  <li>
                    <Link
                      to="/climate-damage-claim"
                      className={`flex items-center px-2 md:px-3 py-2 md:py-2.5 rounded-lg ${isCollapsed ? 'justify-center' : ''} ${
                        isActive('/climate-damage-claim') 
                          ? 'bg-blue-500 text-white font-medium shadow-sm' 
                          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                      } group transition-all duration-200 touch-manipulation`}
                    >
                      <FontAwesomeIcon
                        icon={faFileInvoiceDollar}
                        className={`w-4 h-4 md:w-5 md:h-5 ${isActive('/climate-damage-claim') ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`}
                      />
                      {!isCollapsed && <span className="ml-2 md:ml-3 whitespace-nowrap text-sm md:text-base">Climate Damage Claim</span>}
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/financial-aid"
                      className={`flex items-center px-2 md:px-3 py-2 md:py-2.5 rounded-lg ${isCollapsed ? 'justify-center' : ''} ${
                        isActive('/financial-aid') 
                          ? 'bg-blue-500 text-white font-medium shadow-sm' 
                          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                      } group transition-all duration-200 touch-manipulation`}
                    >
                      <FontAwesomeIcon
                        icon={faHandHoldingDollar}
                        className={`w-4 h-4 md:w-5 md:h-5 ${isActive('/financial-aid') ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`}
                      />
                      {!isCollapsed && <span className="ml-2 md:ml-3 whitespace-nowrap text-sm md:text-base">Financial Aid</span>}
                    </Link>
                  </li>
                </ul>
              </div>
            )}

            {/* AI Tools */}
            <div className="mb-4">
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2 px-2">
                  Tools
                </h3>
              )}
              <ul className="space-y-1">
                <li>
                  <Link
                    to="/ai-assistant"
                    className={`flex items-center px-2 md:px-3 py-2 md:py-2.5 rounded-lg ${isCollapsed ? 'justify-center' : ''} ${
                      isActive('/ai-assistant') 
                        ? 'bg-blue-500 text-white font-medium shadow-sm' 
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                    } group transition-all duration-200 touch-manipulation`}
                  >
                    <FontAwesomeIcon
                      icon={faRobot}
                      className={`w-4 h-4 md:w-5 md:h-5 ${isActive('/ai-assistant') ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`}
                    />
                    {!isCollapsed && <span className="ml-2 md:ml-3 whitespace-nowrap text-sm md:text-base">AI Assistant</span>}
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="mt-auto border-t border-blue-200 pt-3 md:pt-4">
          <div className="px-2 md:px-3">
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2 px-2">
                Account
              </h3>
            )}
            <ul className="space-y-1">
              <li>
                <Link
                  to="/profile"
                  className={`flex items-center px-2 md:px-3 py-2 md:py-2.5 rounded-lg ${isCollapsed ? 'justify-center' : ''} ${
                    isActive('/profile') 
                      ? 'bg-blue-500 text-white font-medium shadow-sm' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  } group transition-all duration-200 touch-manipulation`}
                >
                  <FontAwesomeIcon
                    icon={faUser}
                    className={`w-4 h-4 md:w-5 md:h-5 ${isActive('/profile') ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`}
                  />
                  {!isCollapsed && <span className="ml-2 md:ml-3 whitespace-nowrap text-sm md:text-base">Profile</span>}
                </Link>
              </li>              
            </ul>
          </div>
        </div>
      </div>
    </aside>
    
  );
};



export default Sidebar;
