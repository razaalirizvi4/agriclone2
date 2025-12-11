// Run with: MONGO_URI="mongodb://localhost:27017/agripro" node seed.js
const mongoose = require('mongoose');
const Crop = require('./crop.model');
const connectDB = require('../../../serverSetup/database');

const { Types } = mongoose;
const now = new Date();

function oid(hex) {
    // Helper to create consistent ObjectIds for readability (falls back if invalid)
    try {
        return new Types.ObjectId(hex);
    } catch (e) {
        return new Types.ObjectId();
    }
}

const crops = [
    {
        _id: oid('64a1f0000000000000000001'),
        name: 'Wheat',
        icon: '🌾',
        actualYield: null,
        recipes: [
            {
                id: 'wheat_rabi_standard',
                recipeInfo: {
                    description:
                        'Standard Rabi wheat for Punjab: conventional tillage, seed rate moderate, flood irrigation.',
                    createdBy: oid('64a1f00000000000000000011'),
                    createdAt: now,
                    updatedAt: now,
                    expectedYield: {
                        value: 3.8,
                        unit: 'tons',
                        areaBasis: 'hectare',
                        notes: 'Typical range 3.0–4.2 t/ha; depends on fertilization and variety.'
                    }
                },
                recipeRules: {
                    temporalConstraints: {
                        seedDateRangeStart: new Date('2025-10-15'),
                        seedDateRangeEnd: new Date('2025-11-30'),
                        harvestDateRangeStart: new Date('2026-04-15'),
                        harvestDateRangeEnd: new Date('2026-05-31')
                    },
                    environmentalConditions: {
                        soilPH: { min: 6.0, max: 8.0, optimal: 7.0, unit: 'pH' },
                        temperature: { min: 12, max: 25, optimal: 20, unit: '°C' },
                        humidity: { min: 40, max: 60, optimal: 50, unit: '%' },
                        rainfall: { min: 250, max: 500, optimal: 350, unit: 'mm' },
                        soilType: {
                            allowed: ['Loam', 'Clay-loam', 'Silt-loam'],
                            preferred: ['Loam'],
                            excluded: ['Sandy']
                        }
                    },
                    historicalConstraints: {
                        cropRotation: {
                            avoidPreviousCrops: ['Cotton', 'Rice'],
                            preferredPreviousCrops: ['Pulses', 'Fodder'],
                            minRotationInterval: 1,
                            maxConsecutiveYears: 3
                        },
                        fieldRestPeriod: { min: 20, unit: 'days' },
                        previousCropHarvestDate: { minDaysBeforeSowing: 10, maxDaysBeforeSowing: 30 }
                    }
                },
                recipeWorkflows: [
                    {
                        stepName: 'Land_Prep',
                        sequence: 1,
                        duration: 7,
                        equipmentRequired: [
                            { name: 'Tractor', quantity: 1, optional: false },
                            { name: 'Cultivator', quantity: 1, optional: false },
                            { name: 'Plough', quantity: 1, optional: false }
                        ]
                    },
                    {
                        stepName: 'Seeding',
                        sequence: 2,
                        duration: 1,
                        equipmentRequired: [
                            { name: 'Seed drill', quantity: 1, optional: false },
                            { name: 'Seed bags', quantity: 10, optional: false }
                        ]
                    },
                    {
                        stepName: 'Irrigation',
                        sequence: 3,
                        duration: 120,
                        equipmentRequired: [
                            { name: 'Canal/Flood system', quantity: 1, optional: false },
                            { name: 'Pump (if needed)', quantity: 1, optional: true }
                        ]
                    },
                    {
                        stepName: 'Disease',
                        sequence: 4,
                        duration: 1,
                        equipmentRequired: [
                            { name: 'Knapsack sprayer', quantity: 2, optional: false },
                            { name: 'Fungicide (as needed)', quantity: 0, optional: true }
                        ]
                    },
                    {
                        stepName: 'Fertilizer',
                        sequence: 5,
                        duration: 3,
                        equipmentRequired: [
                            { name: 'Broadcast spreader', quantity: 1, optional: false },
                            { name: 'Fertilizer sacks', quantity: 8, optional: false }
                        ]
                    },
                    {
                        stepName: 'Harvesting',
                        sequence: 6,
                        duration: 3,
                        equipmentRequired: [
                            { name: 'Combine harvester', quantity: 1, optional: true },
                            { name: 'Sickle (manual)', quantity: 10, optional: false }
                        ]
                    }
                ]
            },
            {
                id: 'wheat_zero_till_after_rice',
                recipeInfo: {
                    description:
                        'Zero-tillage wheat sown immediately after paddy harvest to conserve moisture and reduce cost.',
                    createdBy: oid('64a1f00000000000000000012'),
                    createdAt: now,
                    updatedAt: now,
                    expectedYield: {
                        value: 4.0,
                        unit: 'tons',
                        areaBasis: 'hectare',
                        notes: 'Often slightly higher due to conserved soil moisture; depends on timely sowing.'
                    }
                },
                recipeRules: {
                    temporalConstraints: {
                        seedDateRangeStart: new Date('2025-11-01'),
                        seedDateRangeEnd: new Date('2025-11-20'),
                        harvestDateRangeStart: new Date('2026-04-01'),
                        harvestDateRangeEnd: new Date('2026-04-20')
                    },
                    environmentalConditions: {
                        soilPH: { min: 6.0, max: 8.0, optimal: 7.0, unit: 'pH' },
                        temperature: { min: 10, max: 24, optimal: 18, unit: '°C' },
                        humidity: { min: 30, max: 65, optimal: 45, unit: '%' },
                        rainfall: { min: 200, max: 450, optimal: 300, unit: 'mm' },
                        soilType: {
                            allowed: ['Silt-loam', 'Loam'],
                            preferred: ['Silt-loam'],
                            excluded: ['Sandy']
                        }
                    },
                    historicalConstraints: {
                        cropRotation: {
                            avoidPreviousCrops: ['Wheat'],
                            preferredPreviousCrops: ['Rice'],
                            minRotationInterval: 1,
                            maxConsecutiveYears: 2
                        },
                        fieldRestPeriod: { min: 5, unit: 'days' },
                        previousCropHarvestDate: { minDaysBeforeSowing: 3, maxDaysBeforeSowing: 15 }
                    }
                },
                recipeWorkflows: [
                    {
                        stepName: 'Land_Prep',
                        sequence: 1,
                        duration: 0,
                        equipmentRequired: [{ name: 'Zero-till drill', quantity: 1, optional: false }]
                    },
                    {
                        stepName: 'Seeding',
                        sequence: 2,
                        duration: 1,
                        equipmentRequired: [{ name: 'Zero-till seed drill', quantity: 1, optional: false }]
                    },
                    {
                        stepName: 'Irrigation',
                        sequence: 3,
                        duration: 100,
                        equipmentRequired: [
                            { name: 'Tube well/pump', quantity: 1, optional: true },
                            { name: 'Canal access', quantity: 1, optional: true }
                        ]
                    },
                    {
                        stepName: 'Disease',
                        sequence: 4,
                        duration: 1,
                        equipmentRequired: [{ name: 'Knapsack sprayer', quantity: 2, optional: false }]
                    },
                    {
                        stepName: 'Fertilizer',
                        sequence: 5,
                        duration: 2,
                        equipmentRequired: [{ name: 'Fertilizer spreader', quantity: 1, optional: true }]
                    },
                    {
                        stepName: 'Harvesting',
                        sequence: 6,
                        duration: 2,
                        equipmentRequired: [{ name: 'Combine harvester', quantity: 1, optional: true }]
                    }
                ]
            }
        ]
    },
    {
        _id: oid('64a1f0000000000000000002'),
        name: 'Rice',
        icon: '🍚',
        actualYield: null,
        recipes: [
            {
                id: 'rice_basmati_transplant',
                recipeInfo: {
                    description:
                        'Transplanted Basmati rice grown with puddling and maintained standing water for aromatic long-grain rice.',
                    createdBy: oid('64a1f00000000000000000021'),
                    createdAt: now,
                    updatedAt: now,
                    expectedYield: {
                        value: 3.4,
                        unit: 'tons',
                        areaBasis: 'hectare',
                        notes: 'Typical basmati yields for irrigated transplanted system.'
                    }
                },
                recipeRules: {
                    temporalConstraints: {
                        seedDateRangeStart: new Date('2025-05-20'),
                        seedDateRangeEnd: new Date('2025-06-10'),
                        harvestDateRangeStart: new Date('2025-10-01'),
                        harvestDateRangeEnd: new Date('2025-10-20')
                    },
                    environmentalConditions: {
                        soilPH: { min: 5.5, max: 7.5, optimal: 6.5, unit: 'pH' },
                        temperature: { min: 25, max: 35, optimal: 30, unit: '°C' },
                        humidity: { min: 70, max: 90, optimal: 80, unit: '%' },
                        rainfall: { min: 800, max: 2000, optimal: 1200, unit: 'mm' },
                        soilType: {
                            allowed: ['Clay-loam', 'Silt-loam', 'Clay'],
                            preferred: ['Clay-loam'],
                            excluded: ['Sandy']
                        }
                    },
                    historicalConstraints: {
                        cropRotation: {
                            avoidPreviousCrops: ['Rice'],
                            preferredPreviousCrops: ['Wheat', 'Fodder'],
                            minRotationInterval: 1,
                            maxConsecutiveYears: 1
                        },
                        fieldRestPeriod: { min: 25, unit: 'days' },
                        previousCropHarvestDate: { minDaysBeforeSowing: 15, maxDaysBeforeSowing: 40 }
                    }
                },
                recipeWorkflows: [
                    {
                        stepName: 'Land_Prep',
                        sequence: 1,
                        duration: 10,
                        equipmentRequired: [
                            { name: 'Tractor', quantity: 1, optional: false },
                            { name: 'Rotavator/puddler', quantity: 1, optional: false }
                        ]
                    },
                    {
                        stepName: 'Seeding',
                        sequence: 2,
                        duration: 20,
                        equipmentRequired: [{ name: 'Nursery bed tools', quantity: 5, optional: false }]
                    },
                    {
                        stepName: 'Irrigation',
                        sequence: 3,
                        duration: 120,
                        equipmentRequired: [
                            { name: 'Canal/flood', quantity: 1, optional: false },
                            { name: 'Puddling equipment', quantity: 1, optional: false }
                        ]
                    },
                    {
                        stepName: 'Disease',
                        sequence: 4,
                        duration: 1,
                        equipmentRequired: [{ name: 'Knapsack sprayer', quantity: 2, optional: false }]
                    },
                    {
                        stepName: 'Fertilizer',
                        sequence: 5,
                        duration: 3,
                        equipmentRequired: [{ name: 'Fertilizer spreader', quantity: 1, optional: false }]
                    },
                    {
                        stepName: 'Harvesting',
                        sequence: 6,
                        duration: 5,
                        equipmentRequired: [
                            { name: 'Combine harvester', quantity: 1, optional: true },
                            { name: 'Manual harvesting crew', quantity: 20, optional: false }
                        ]
                    }
                ]
            },
            {
                id: 'rice_dsr_direct_seeded',
                recipeInfo: {
                    description:
                        'Direct Seeded Rice (DSR) to reduce water usage and labour — requires different weed and irrigation management.',
                    createdBy: oid('64a1f00000000000000000022'),
                    createdAt: now,
                    updatedAt: now,
                    expectedYield: {
                        value: 3.0,
                        unit: 'tons',
                        areaBasis: 'hectare',
                        notes: 'Usually slightly lower than transplanted basmati but saves water.'
                    }
                },
                recipeRules: {
                    temporalConstraints: {
                        seedDateRangeStart: new Date('2025-06-10'),
                        seedDateRangeEnd: new Date('2025-07-05'),
                        harvestDateRangeStart: new Date('2025-09-25'),
                        harvestDateRangeEnd: new Date('2025-10-20')
                    },
                    environmentalConditions: {
                        soilPH: { min: 5.8, max: 7.2, optimal: 6.5, unit: 'pH' },
                        temperature: { min: 24, max: 34, optimal: 29, unit: '°C' },
                        humidity: { min: 65, max: 90, optimal: 78, unit: '%' },
                        rainfall: { min: 600, max: 1600, optimal: 1000, unit: 'mm' },
                        soilType: {
                            allowed: ['Loam', 'Silt-loam'],
                            preferred: ['Loam'],
                            excluded: ['Very sandy']
                        }
                    },
                    historicalConstraints: {
                        cropRotation: {
                            avoidPreviousCrops: ['Maize in same season'],
                            preferredPreviousCrops: ['Wheat'],
                            minRotationInterval: 1,
                            maxConsecutiveYears: 2
                        },
                        fieldRestPeriod: { min: 15, unit: 'days' },
                        previousCropHarvestDate: { minDaysBeforeSowing: 10, maxDaysBeforeSowing: 25 }
                    }
                },
                recipeWorkflows: [
                    {
                        stepName: 'Land_Prep',
                        sequence: 1,
                        duration: 3,
                        equipmentRequired: [
                            { name: 'Tractor', quantity: 1, optional: false },
                            { name: 'Cultivator', quantity: 1, optional: false }
                        ]
                    },
                    {
                        stepName: 'Seeding',
                        sequence: 2,
                        duration: 2,
                        equipmentRequired: [
                            { name: 'Seed broadcaster', quantity: 1, optional: false },
                            { name: 'Drill (for row DSR)', quantity: 1, optional: true }
                        ]
                    },
                    {
                        stepName: 'Irrigation',
                        sequence: 3,
                        duration: 90,
                        equipmentRequired: [
                            { name: 'Intermittent irrigation system', quantity: 1, optional: false }
                        ]
                    },
                    {
                        stepName: 'Disease',
                        sequence: 4,
                        duration: 1,
                        equipmentRequired: [
                            { name: 'Herbicide/Fungicide sprayer', quantity: 2, optional: false }
                        ]
                    },
                    {
                        stepName: 'Fertilizer',
                        sequence: 5,
                        duration: 3,
                        equipmentRequired: [{ name: 'Fertilizer spreader', quantity: 1, optional: true }]
                    },
                    {
                        stepName: 'Harvesting',
                        sequence: 6,
                        duration: 4,
                        equipmentRequired: [{ name: 'Combine harvester', quantity: 1, optional: true }]
                    }
                ]
            }
        ]
    },
    {
        _id: oid('64a1f0000000000000000003'),
        name: 'Maize',
        icon: '🌽',
        actualYield: null,
        recipes: [
            {
                id: 'maize_spring_hybrid',
                recipeInfo: {
                    description: 'Spring-planted hybrid maize for grain; irrigated and fertilized for high yield.',
                    createdBy: oid('64a1f00000000000000000031'),
                    createdAt: now,
                    updatedAt: now,
                    expectedYield: {
                        value: 8.0,
                        unit: 'tons',
                        areaBasis: 'hectare',
                        notes: 'Hybrid varieties under irrigation can reach 6–9 t/ha.'
                    }
                },
                recipeRules: {
                    temporalConstraints: {
                        seedDateRangeStart: new Date('2026-02-01'),
                        seedDateRangeEnd: new Date('2026-03-20'),
                        harvestDateRangeStart: new Date('2026-06-01'),
                        harvestDateRangeEnd: new Date('2026-07-15')
                    },
                    environmentalConditions: {
                        soilPH: { min: 5.8, max: 7.2, optimal: 6.5, unit: 'pH' },
                        temperature: { min: 18, max: 32, optimal: 26, unit: '°C' },
                        humidity: { min: 40, max: 75, optimal: 55, unit: '%' },
                        rainfall: { min: 500, max: 800, optimal: 650, unit: 'mm' },
                        soilType: {
                            allowed: ['Deep loam', 'Silt-loam'],
                            preferred: ['Deep loam'],
                            excluded: ['Rocky', 'Very shallow']
                        }
                    },
                    historicalConstraints: {
                        cropRotation: {
                            avoidPreviousCrops: ['Maize'],
                            preferredPreviousCrops: ['Legumes', 'Fodder'],
                            minRotationInterval: 1,
                            maxConsecutiveYears: 1
                        },
                        fieldRestPeriod: { min: 20, unit: 'days' },
                        previousCropHarvestDate: { minDaysBeforeSowing: 10, maxDaysBeforeSowing: 25 }
                    }
                },
                recipeWorkflows: [
                    {
                        stepName: 'Land_Prep',
                        sequence: 1,
                        duration: 3,
                        equipmentRequired: [
                            { name: 'Tractor', quantity: 1, optional: false },
                            { name: 'Plough', quantity: 1, optional: false }
                        ]
                    },
                    {
                        stepName: 'Seeding',
                        sequence: 2,
                        duration: 1,
                        equipmentRequired: [{ name: 'Planter', quantity: 1, optional: false }]
                    },
                    {
                        stepName: 'Irrigation',
                        sequence: 3,
                        duration: 90,
                        equipmentRequired: [
                            { name: 'Drip irrigation', quantity: 1, optional: true },
                            { name: 'Surface irrigation', quantity: 1, optional: true }
                        ]
                    },
                    {
                        stepName: 'Disease',
                        sequence: 4,
                        duration: 1,
                        equipmentRequired: [
                            { name: 'Pheromone traps', quantity: 10, optional: true },
                            { name: 'Knapsack sprayer', quantity: 2, optional: false }
                        ]
                    },
                    {
                        stepName: 'Fertilizer',
                        sequence: 5,
                        duration: 3,
                        equipmentRequired: [
                            { name: 'Fertilizer spreader', quantity: 1, optional: false }
                        ]
                    },
                    {
                        stepName: 'Harvesting',
                        sequence: 6,
                        duration: 5,
                        equipmentRequired: [
                            { name: 'Combine harvester', quantity: 1, optional: true },
                            { name: 'Manual crew', quantity: 8, optional: false }
                        ]
                    }
                ]
            },
            {
                id: 'maize_autumn_rainfed',
                recipeInfo: {
                    description:
                        'Autumn maize that may be rainfed; variety chosen for shorter season and drought resilience.',
                    createdBy: oid('64a1f00000000000000000032'),
                    createdAt: now,
                    updatedAt: now,
                    expectedYield: {
                        value: 5.0,
                        unit: 'tons',
                        areaBasis: 'hectare',
                        notes: 'Rainfed yields are lower and more variable.'
                    }
                },
                recipeRules: {
                    temporalConstraints: {
                        seedDateRangeStart: new Date('2025-07-25'),
                        seedDateRangeEnd: new Date('2025-08-20'),
                        harvestDateRangeStart: new Date('2025-11-01'),
                        harvestDateRangeEnd: new Date('2025-12-15')
                    },
                    environmentalConditions: {
                        soilPH: { min: 5.5, max: 7.5, optimal: 6.5, unit: 'pH' },
                        temperature: { min: 20, max: 34, optimal: 27, unit: '°C' },
                        humidity: { min: 45, max: 80, optimal: 60, unit: '%' },
                        rainfall: { min: 300, max: 700, optimal: 450, unit: 'mm' },
                        soilType: {
                            allowed: ['Loam', 'Sandy-loam'],
                            preferred: ['Loam'],
                            excluded: ['Waterlogged']
                        }
                    },
                    historicalConstraints: {
                        cropRotation: {
                            avoidPreviousCrops: ['Wheat (immediately before)'],
                            preferredPreviousCrops: ['Fodder'],
                            minRotationInterval: 1,
                            maxConsecutiveYears: 2
                        },
                        fieldRestPeriod: { min: 10, unit: 'days' },
                        previousCropHarvestDate: { minDaysBeforeSowing: 10, maxDaysBeforeSowing: 20 }
                    }
                },
                recipeWorkflows: [
                    {
                        stepName: 'Land_Prep',
                        sequence: 1,
                        duration: 4,
                        equipmentRequired: [{ name: 'Tractor', quantity: 1, optional: false }]
                    },
                    {
                        stepName: 'Seeding',
                        sequence: 2,
                        duration: 1,
                        equipmentRequired: [{ name: 'Planter', quantity: 1, optional: false }]
                    },
                    {
                        stepName: 'Irrigation',
                        sequence: 3,
                        duration: 60,
                        equipmentRequired: [
                            { name: 'Supplemental pump', quantity: 1, optional: true }
                        ]
                    },
                    {
                        stepName: 'Disease',
                        sequence: 4,
                        duration: 1,
                        equipmentRequired: [
                            { name: 'Insecticide sprayer', quantity: 2, optional: false }
                        ]
                    },
                    {
                        stepName: 'Fertilizer',
                        sequence: 5,
                        duration: 2,
                        equipmentRequired: [{ name: 'Fertilizer bags', quantity: 6, optional: false }]
                    },
                    {
                        stepName: 'Harvesting',
                        sequence: 6,
                        duration: 4,
                        equipmentRequired: [
                            { name: 'Combine harvester', quantity: 1, optional: true }
                        ]
                    }
                ]
            }
        ]
    },
    {
        _id: oid('64a1f0000000000000000004'),
        name: 'Cotton',
        icon: '🧵',
        actualYield: null,
        recipes: [
            {
                id: 'cotton_bt_punjab',
                recipeInfo: {
                    description:
                        'Bt cotton with recommended fertilization and pest monitoring for Punjab conditions.',
                    createdBy: oid('64a1f00000000000000000041'),
                    createdAt: now,
                    updatedAt: now,
                    expectedYield: {
                        value: 2.6,
                        unit: 'tons',
                        areaBasis: 'hectare',
                        notes: 'Yield reported as seed + lint mass; lint fraction variable.'
                    }
                },
                recipeRules: {
                    temporalConstraints: {
                        seedDateRangeStart: new Date('2026-04-01'),
                        seedDateRangeEnd: new Date('2026-05-31'),
                        harvestDateRangeStart: new Date('2026-08-01'),
                        harvestDateRangeEnd: new Date('2026-11-30')
                    },
                    environmentalConditions: {
                        soilPH: { min: 5.5, max: 8.0, optimal: 6.8, unit: 'pH' },
                        temperature: { min: 21, max: 37, optimal: 30, unit: '°C' },
                        humidity: { min: 40, max: 75, optimal: 55, unit: '%' },
                        rainfall: { min: 300, max: 700, optimal: 450, unit: 'mm' },
                        soilType: {
                            allowed: ['Sandy-loam', 'Loam'],
                            preferred: ['Sandy-loam', 'Loam'],
                            excluded: ['Waterlogged']
                        }
                    },
                    historicalConstraints: {
                        cropRotation: {
                            avoidPreviousCrops: ['Cotton'],
                            preferredPreviousCrops: ['Wheat', 'Fodder'],
                            minRotationInterval: 1,
                            maxConsecutiveYears: 1
                        },
                        fieldRestPeriod: { min: 30, unit: 'days' },
                        previousCropHarvestDate: { minDaysBeforeSowing: 20, maxDaysBeforeSowing: 35 }
                    }
                },
                recipeWorkflows: [
                    {
                        stepName: 'Land_Prep',
                        sequence: 1,
                        duration: 7,
                        equipmentRequired: [
                            { name: 'Tractor', quantity: 1, optional: false },
                            { name: 'Plough', quantity: 1, optional: false }
                        ]
                    },
                    {
                        stepName: 'Seeding',
                        sequence: 2,
                        duration: 2,
                        equipmentRequired: [
                            { name: 'Precision planter', quantity: 1, optional: false }
                        ]
                    },
                    {
                        stepName: 'Irrigation',
                        sequence: 3,
                        duration: 140,
                        equipmentRequired: [
                            { name: 'Drip irrigation', quantity: 1, optional: true },
                            { name: 'Canal/furrow system', quantity: 1, optional: true }
                        ]
                    },
                    {
                        stepName: 'Disease',
                        sequence: 4,
                        duration: 1,
                        equipmentRequired: [
                            { name: 'Pheromone traps', quantity: 12, optional: true },
                            { name: 'Sprayer', quantity: 2, optional: false }
                        ]
                    },
                    {
                        stepName: 'Fertilizer',
                        sequence: 5,
                        duration: 3,
                        equipmentRequired: [
                            { name: 'Fertilizer spreader', quantity: 1, optional: false },
                            { name: 'Boron supplement', quantity: 0, optional: true }
                        ]
                    },
                    {
                        stepName: 'Harvesting',
                        sequence: 6,
                        duration: 40,
                        equipmentRequired: [
                            { name: 'Manual pickers', quantity: 30, optional: false },
                            { name: 'Mechanical picker', quantity: 1, optional: true }
                        ]
                    }
                ]
            },
            {
                id: 'cotton_desert_drought_tolerant',
                recipeInfo: {
                    description:
                        'Non-Bt desi/indigenous cotton variety adapted to lower rainfall and sandy-loam soils.',
                    createdBy: oid('64a1f00000000000000000042'),
                    createdAt: now,
                    updatedAt: now,
                    expectedYield: {
                        value: 1.8,
                        unit: 'tons',
                        areaBasis: 'hectare',
                        notes: 'Lower yields but resilient under low-water conditions.'
                    }
                },
                recipeRules: {
                    temporalConstraints: {
                        seedDateRangeStart: new Date('2026-03-15'),
                        seedDateRangeEnd: new Date('2026-04-30'),
                        harvestDateRangeStart: new Date('2026-08-15'),
                        harvestDateRangeEnd: new Date('2026-10-31')
                    },
                    environmentalConditions: {
                        soilPH: { min: 5.0, max: 7.8, optimal: 6.5, unit: 'pH' },
                        temperature: { min: 20, max: 38, optimal: 31, unit: '°C' },
                        humidity: { min: 30, max: 65, optimal: 50, unit: '%' },
                        rainfall: { min: 200, max: 500, optimal: 300, unit: 'mm' },
                        soilType: {
                            allowed: ['Sandy-loam', 'Loam'],
                            preferred: ['Sandy-loam'],
                            excluded: ['Heavy clay', 'Waterlogged']
                        }
                    },
                    historicalConstraints: {
                        cropRotation: {
                            avoidPreviousCrops: ['Cotton'],
                            preferredPreviousCrops: ['Fodder', 'Pulses'],
                            minRotationInterval: 1,
                            maxConsecutiveYears: 2
                        },
                        fieldRestPeriod: { min: 30, unit: 'days' },
                        previousCropHarvestDate: { minDaysBeforeSowing: 15, maxDaysBeforeSowing: 40 }
                    }
                },
                recipeWorkflows: [
                    {
                        stepName: 'Land_Prep',
                        sequence: 1,
                        duration: 5,
                        equipmentRequired: [
                            { name: 'Tractor', quantity: 1, optional: false },
                            { name: 'Rotavator', quantity: 1, optional: false }
                        ]
                    },
                    {
                        stepName: 'Seeding',
                        sequence: 2,
                        duration: 2,
                        equipmentRequired: [{ name: 'Planter', quantity: 1, optional: false }]
                    },
                    {
                        stepName: 'Irrigation',
                        sequence: 3,
                        duration: 100,
                        equipmentRequired: [
                            { name: 'Supplemental irrigation pump', quantity: 1, optional: true }
                        ]
                    },
                    {
                        stepName: 'Disease',
                        sequence: 4,
                        duration: 1,
                        equipmentRequired: [{ name: 'Sprayer', quantity: 1, optional: false }]
                    },
                    {
                        stepName: 'Fertilizer',
                        sequence: 5,
                        duration: 2,
                        equipmentRequired: [{ name: 'Fertilizer sacks', quantity: 5, optional: false }]
                    },
                    {
                        stepName: 'Harvesting',
                        sequence: 6,
                        duration: 30,
                        equipmentRequired: [{ name: 'Manual pickers', quantity: 25, optional: false }]
                    }
                ]
            }
        ]
    }
];

// Seed function (mirrors typeSeed style)
const seedCrops = async () => {
    await connectDB();

    try {
        await Crop.deleteMany();
        console.log('🧹 Cleared existing crops');

        await Crop.insertMany(crops);
        console.log('✅ Crops seeded successfully:', crops.length);
    } catch (err) {
        console.error('❌ Crop seeding error:', err);
    } finally {
        mongoose.connection.close();
    }
};

// Run the seed
seedCrops();

