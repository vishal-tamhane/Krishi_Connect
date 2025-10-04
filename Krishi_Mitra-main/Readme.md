# Precision Farming Platform

## Overview

This project is a **Precision Farming Dashboard** designed to empower farmers with actionable insights by integrating spatial farm mapping with crop cycle and irrigation scheduling. Through precise location input via farm boundary plotting on Google Maps, and user inputs of crop type and planting date, the platform delivers customized crop growth timelines and optimized irrigation schedules using localized weather and environmental data.

The system focuses on improving farm productivity while conserving resources by enabling data-driven decision making tailored to exact farm geography and crop needs.

## Key Features

- **Interactive Field Mapping:** Users plot polygons on an embedded Google Maps interface to define exact farm boundaries for precise geo-spatial analytics.
- **User Inputs:** Select crop type from common crop lists and specify the planting date for accurate cycle calculations.
- **Dynamic Crop Cycle Timeline:** Visual timeline outlining growth stages with expected dates and progress indicators based on crop and planting data.
- **Optimized Irrigation Schedule:** Actionable watering calendar tailored by local weather forecasts, crop water needs, and soil conditions.
- **Localized Weather Insights:** Weather data aggregated over the farm polygon area ensures relevancy and precision.
- **Responsive UI:** Designed for seamless use across desktop and mobile devices.
- **Modular API Design:** Enables integration with external AI models or sensor data backends in the future.
- **Alerts and Notifications:** Reminders for irrigation events and growth milestones to assist timely field management.

## User Inputs

- **Crop Type:** Dropdown selection for crop species.
- **Planting Date:** Date picker for sowing date.
- **Location:** Polygon drawing on map to outline farm field.

## How It Works

1. The user defines their farm field on the map by plotting points to form a polygon.
2. The user selects the crop type and inputs planting date.
3. The system fetches localized weather and environmental data for the farm boundary.
4. A dynamic crop cycle timeline is generated based on the input and crop growth parameters.
5. An irrigation schedule optimized for weather and crop needs is calculated and displayed.
6. Alerts notify the user of upcoming irrigation or growth stage milestones.

## Technology Stack

- **Frontend:** React.js with Material-UI, Google Maps API for field plotting.
- **Backend:** Flask RESTful API serving data and integration endpoints.
- **Databases:** PostgreSQL for user and crop data, MongoDB for weather and environmental info.
- **APIs:** External weather data providers (OpenWeather), customizable for AI model integration later.

