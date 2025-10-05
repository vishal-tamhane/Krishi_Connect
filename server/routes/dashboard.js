const express = require('express');
const router = express.Router();
const { authenticateToken, farmerOnly, governmentOnly } = require('../middleware/auth');
const fieldService = require('../services/fieldService');
const cropService = require('../services/cropService');
const climateClaimService = require('../services/climateClaimService');
const { logger } = require('../config/database');

/**
 * @route GET /api/dashboard/farmer
 * @desc Get farmer dashboard data
 * @access Private (Farmers only)
 */
router.get('/farmer', authenticateToken, farmerOnly, async (req, res) => {
  try {
    // Get all dashboard data in parallel
    const [
      fieldStats,
      cropStats,
      claimStats,
      recentCrops,
      recentClaims
    ] = await Promise.all([
      fieldService.getFieldStatistics(req.user.id),
      cropService.getCropStatistics(req.user.id),
      climateClaimService.getClaimStatistics(req.user.id),
      cropService.getUserCrops(req.user.id, 5), // Get last 5 crops
      climateClaimService.getUserClaims(req.user.id, 5) // Get last 5 claims
    ]);

    // Calculate additional metrics
    const activeCrops = recentCrops.filter(crop => crop.crop_status === 'active');
    const upcomingTasks = [];

    // Generate upcoming tasks based on crop data
    activeCrops.forEach(crop => {
      const sowingDate = new Date(crop.sowing_date);
      const daysSinceSowing = Math.floor((new Date() - sowingDate) / (1000 * 60 * 60 * 24));
      
      // Example task generation logic
      if (daysSinceSowing >= 7 && crop.current_stage === 'seeded') {
        upcomingTasks.push(`Check germination for ${crop.crop_name} in ${crop.field_name}`);
      }
      
      if (daysSinceSowing >= 30 && crop.current_stage === 'vegetative') {
        upcomingTasks.push(`First fertilizer application due for ${crop.crop_name}`);
      }
      
      if (daysSinceSowing >= 14 && crop.total_water_used < 50) {
        upcomingTasks.push(`Irrigation needed for ${crop.crop_name} in ${crop.field_name}`);
      }
    });

    // Weather alerts (mock data - would integrate with weather API)
    const weatherAlerts = [
      // Mock alerts
    ];

    const dashboardData = {
      overview: {
        total_fields: fieldStats.total_fields,
        total_area: fieldStats.total_area,
        active_crops: cropStats.active_crops,
        total_crops: cropStats.total_crops,
        pending_claims: claimStats.pending_claims,
        approved_claims: claimStats.approved_claims
      },
      field_statistics: fieldStats,
      crop_statistics: cropStats,
      claim_statistics: claimStats,
      recent_activities: {
        recent_crops: recentCrops.slice(0, 3).map(crop => ({
          id: crop.id,
          crop_name: crop.crop_name,
          field_name: crop.field_name,
          current_stage: crop.current_stage,
          sowing_date: crop.sowing_date,
          days_since_sowing: Math.floor((new Date() - new Date(crop.sowing_date)) / (1000 * 60 * 60 * 24))
        })),
        recent_claims: recentClaims.slice(0, 3).map(claim => ({
          id: claim.id,
          claim_reference_number: claim.claim_reference_number,
          damage_type: claim.damage_type,
          claim_status: claim.claim_status,
          created_at: claim.created_at
        }))
      },
      alerts_and_tasks: {
        weather_alerts: weatherAlerts,
        upcoming_tasks: upcomingTasks.slice(0, 5), // Limit to 5 tasks
        notifications: [
          // Could include system notifications, reminders, etc.
        ]
      },
      resource_usage: {
        total_water_used: cropStats.total_water_used,
        avg_water_per_crop: cropStats.avg_water_usage,
        fields_with_soil_data: fieldStats.fields_with_soil_data
      }
    };
    
    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Farmer dashboard error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'DASHBOARD_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * @route GET /api/dashboard/government
 * @desc Get government dashboard data
 * @access Private (Government only)
 */
router.get('/government', authenticateToken, governmentOnly, async (req, res) => {
  try {
    // Get government-specific dashboard data
    const [
      allClaimStats,
      pendingClaims,
      recentClaims
    ] = await Promise.all([
      climateClaimService.getClaimStatistics(), // All claims statistics
      climateClaimService.getAllClaimsForGovernment({ status: 'submitted' }, 10),
      climateClaimService.getAllClaimsForGovernment({}, 10)
    ]);

    // Calculate processing metrics
    const avgProcessingTime = '5-7 days'; // Mock data - would calculate from actual data
    const claimsThisMonth = recentClaims.filter(claim => {
      const claimDate = new Date(claim.created_at);
      const thisMonth = new Date();
      return claimDate.getMonth() === thisMonth.getMonth() && 
             claimDate.getFullYear() === thisMonth.getFullYear();
    }).length;

    // Priority claims (high severity or high value)
    const priorityClaims = recentClaims.filter(claim => 
      claim.severity_level === 'severe' || 
      claim.severity_level === 'complete' ||
      claim.estimated_loss_amount > 100000
    ).slice(0, 5);

    const dashboardData = {
      overview: {
        total_claims: allClaimStats.total_claims,
        pending_review: allClaimStats.pending_claims + allClaimStats.under_review_claims,
        approved_this_month: allClaimStats.approved_claims,
        total_disbursed: allClaimStats.total_approved_amount,
        claims_this_month: claimsThisMonth
      },
      claim_statistics: {
        ...allClaimStats,
        avg_processing_time: avgProcessingTime,
        approval_rate: allClaimStats.total_claims > 0 
          ? ((allClaimStats.approved_claims / allClaimStats.total_claims) * 100).toFixed(1) 
          : 0
      },
      pending_actions: {
        claims_needing_review: pendingClaims.slice(0, 5).map(claim => ({
          id: claim.id,
          claim_reference_number: claim.claim_reference_number,
          farmer_name: claim.farmer_name,
          damage_type: claim.damage_type,
          severity_level: claim.severity_level,
          estimated_loss_amount: claim.estimated_loss_amount,
          days_pending: Math.floor((new Date() - new Date(claim.created_at)) / (1000 * 60 * 60 * 24)),
          created_at: claim.created_at
        })),
        priority_claims: priorityClaims.map(claim => ({
          id: claim.id,
          claim_reference_number: claim.claim_reference_number,
          farmer_name: claim.farmer_name,
          severity_level: claim.severity_level,
          estimated_loss_amount: claim.estimated_loss_amount,
          reason: claim.severity_level === 'severe' || claim.severity_level === 'complete' 
            ? 'High severity' 
            : 'High value claim'
        }))
      },
      recent_activities: {
        recent_claims: recentClaims.slice(0, 5).map(claim => ({
          id: claim.id,
          claim_reference_number: claim.claim_reference_number,
          farmer_name: claim.farmer_name,
          damage_type: claim.damage_type,
          claim_status: claim.claim_status,
          estimated_loss_amount: claim.estimated_loss_amount,
          created_at: claim.created_at
        }))
      },
      financial_summary: {
        total_estimated_losses: allClaimStats.total_estimated_loss,
        total_approved_amount: allClaimStats.total_approved_amount,
        pending_approval_amount: pendingClaims.reduce((sum, claim) => sum + claim.estimated_loss_amount, 0),
        avg_claim_amount: allClaimStats.avg_claim_amount
      }
    };
    
    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Government dashboard error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GOVERNMENT_DASHBOARD_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * @route GET /api/dashboard/analytics
 * @desc Get analytics data for both user types
 * @access Private
 */
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const { timeframe = '30d', metric = 'all' } = req.query;
    
    // Calculate date range based on timeframe
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    const analyticsData = {
      timeframe,
      period: {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      },
      metrics: {}
    };

    if (req.user.user_type === 'farmer') {
      // Farmer-specific analytics
      const [cropStats, claimStats] = await Promise.all([
        cropService.getCropStatistics(req.user.id),
        climateClaimService.getClaimStatistics(req.user.id)
      ]);

      analyticsData.metrics = {
        crop_performance: {
          total_crops: cropStats.total_crops,
          active_crops: cropStats.active_crops,
          harvest_success_rate: cropStats.total_crops > 0 
            ? ((cropStats.harvested_crops / cropStats.total_crops) * 100).toFixed(1)
            : 0
        },
        resource_efficiency: {
          avg_water_usage: cropStats.avg_water_usage,
          total_water_used: cropStats.total_water_used
        },
        claim_summary: {
          total_claims: claimStats.total_claims,
          approval_rate: claimStats.total_claims > 0
            ? ((claimStats.approved_claims / claimStats.total_claims) * 100).toFixed(1)
            : 0
        }
      };
    } else if (req.user.user_type === 'government') {
      // Government-specific analytics
      const claimStats = await climateClaimService.getClaimStatistics();

      analyticsData.metrics = {
        claim_processing: {
          total_processed: claimStats.approved_claims + claimStats.rejected_claims,
          approval_rate: (claimStats.approved_claims + claimStats.rejected_claims) > 0
            ? ((claimStats.approved_claims / (claimStats.approved_claims + claimStats.rejected_claims)) * 100).toFixed(1)
            : 0,
          pending_claims: claimStats.pending_claims + claimStats.under_review_claims
        },
        financial_impact: {
          total_disbursed: claimStats.total_approved_amount,
          total_estimated_losses: claimStats.total_estimated_loss,
          avg_claim_value: claimStats.avg_claim_amount
        }
      };
    }
    
    res.json({
      success: true,
      data: analyticsData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Analytics error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYTICS_FAILED',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;