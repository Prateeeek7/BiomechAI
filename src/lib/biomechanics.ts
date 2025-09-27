import { SubjectData } from "../components/SubjectDetails";

// Gait Analysis Calculations with Subject Data
export interface GaitAnalysisResult {
  // Basic gait metrics
  cadence: number; // steps per minute
  strideLength: number; // meters
  walkingSpeed: number; // m/s
  
  // Advanced metrics using subject data
  normalizedCadence: number; // cadence relative to height
  normalizedStrideLength: number; // stride length relative to height
  walkingEfficiency: number; // energy efficiency score
  
  // Force calculations
  groundReactionForce: number; // N
  normalizedForce: number; // force relative to body weight
  
  // Asymmetry metrics
  leftRightAsymmetry: number; // percentage
  stepTimeAsymmetry: number; // percentage
  
  // Fatigue indicators
  fatigueIndex: number; // 0-100 scale
  
  // Subject-specific assessments
  bmiCategory: string;
  riskFactors: string[];
  recommendations: string[];
}

// Posture Analysis with Subject Data
export interface PostureAnalysisResult {
  // Basic posture metrics
  forwardHeadAngle: number;
  shoulderTilt: number;
  spineAlignment: number;
  
  // Subject-adjusted assessments
  normalizedPostureScore: number; // 0-100, adjusted for age/activity
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  
  // Ergonomic assessments
  ergonomicScore: number; // 0-100
  workstationCompatibility: number; // 0-100
  
  // Subject-specific factors
  ageAdjustedScore: number;
  activityBasedScore: number;
  
  // Recommendations based on subject profile
  personalizedRecommendations: string[];
  equipmentSuggestions: string[];
}

// Utility functions for biomechanical calculations

export function calculateBMI(height: number, weight: number): number {
  const heightInM = height / 100;
  return weight / (heightInM * heightInM);
}

export function getBMICategory(bmi: number): { category: string; riskLevel: 'low' | 'moderate' | 'high' | 'critical' } {
  if (bmi < 18.5) return { category: 'Underweight', riskLevel: 'moderate' };
  if (bmi < 25) return { category: 'Normal', riskLevel: 'low' };
  if (bmi < 30) return { category: 'Overweight', riskLevel: 'moderate' };
  return { category: 'Obese', riskLevel: 'high' };
}

export function calculateIdealCadence(height: number, age: number, gender: string): number {
  // Based on research: optimal cadence is related to leg length and age
  const legLength = height * 0.53; // Approximate leg length as 53% of height
  const baseCadence = 180; // Optimal base cadence
  const ageAdjustment = Math.max(0, (30 - age) * 0.5); // Slight decrease with age
  const genderAdjustment = gender === 'female' ? -2 : 0; // Slight adjustment for gender
  
  return Math.max(150, Math.min(200, baseCadence + ageAdjustment + genderAdjustment));
}

export function calculateOptimalStrideLength(height: number, age: number): number {
  // Optimal stride length is approximately 1.3-1.5 times leg length
  const legLength = height * 0.53;
  const baseMultiplier = 1.4;
  const ageAdjustment = Math.max(0, (30 - age) * 0.005); // Slight decrease with age
  
  return legLength * (baseMultiplier + ageAdjustment);
}

export function calculateGroundReactionForce(weight: number, walkingSpeed: number): number {
  // Ground reaction force increases with walking speed
  // Normal walking: ~1.1-1.3x body weight
  // Running: ~2-3x body weight
  const gravity = 9.81; // m/s²
  const bodyWeight = weight * gravity; // N
  
  if (walkingSpeed < 1.5) {
    // Walking
    return bodyWeight * (1.1 + walkingSpeed * 0.1);
  } else {
    // Running
    return bodyWeight * (1.5 + walkingSpeed * 0.3);
  }
}

export function calculateWalkingEfficiency(
  cadence: number,
  strideLength: number,
  walkingSpeed: number,
  subject: SubjectData
): number {
  const idealCadence = calculateIdealCadence(subject.height, subject.age, subject.gender);
  const idealStrideLength = calculateOptimalStrideLength(subject.height, subject.age);
  
  // Efficiency based on how close actual values are to ideal
  const cadenceEfficiency = Math.max(0, 100 - Math.abs(cadence - idealCadence) * 2);
  const strideEfficiency = Math.max(0, 100 - Math.abs(strideLength - idealStrideLength) * 50);
  
  // Weight factor (heavier individuals may have lower efficiency)
  const weightFactor = subject.weight > 100 ? 0.9 : 1.0;
  
  // Activity level factor
  const activityFactors = {
    sedentary: 0.8,
    light: 0.9,
    moderate: 1.0,
    active: 1.1,
    very_active: 1.2
  };
  
  const activityFactor = activityFactors[subject.activityLevel];
  
  return Math.min(100, (cadenceEfficiency + strideEfficiency) / 2 * weightFactor * activityFactor);
}

export function analyzeGaitWithSubjectData(
  rawGaitData: any[],
  subject: SubjectData
): GaitAnalysisResult {
  // Basic calculations (simplified for demonstration)
  const avgCadence = 110 + Math.random() * 20; // Placeholder
  const avgStrideLength = 0.7 + Math.random() * 0.3; // Placeholder
  const avgWalkingSpeed = avgStrideLength * avgCadence / 120; // m/s
  
  // Subject-specific calculations
  const bmi = calculateBMI(subject.height, subject.weight);
  const bmiInfo = getBMICategory(bmi);
  const idealCadence = calculateIdealCadence(subject.height, subject.age, subject.gender);
  const idealStrideLength = calculateOptimalStrideLength(subject.height, subject.age);
  const groundReactionForce = calculateGroundReactionForce(subject.weight, avgWalkingSpeed);
  const walkingEfficiency = calculateWalkingEfficiency(avgCadence, avgStrideLength, avgWalkingSpeed, subject);
  
  // Normalized metrics
  const normalizedCadence = (avgCadence / idealCadence) * 100;
  const normalizedStrideLength = (avgStrideLength / idealStrideLength) * 100;
  const normalizedForce = groundReactionForce / (subject.weight * 9.81); // Relative to body weight
  
  // Risk factors based on subject data
  const riskFactors: string[] = [];
  if (bmiInfo.riskLevel !== 'low') {
    riskFactors.push(`BMI category: ${bmiInfo.category}`);
  }
  if (subject.age > 65) {
    riskFactors.push('Age-related mobility concerns');
  }
  if (subject.medicalConditions.some(condition => 
    condition.toLowerCase().includes('diabetes') || 
    condition.toLowerCase().includes('arthritis') ||
    condition.toLowerCase().includes('back')
  )) {
    riskFactors.push('Medical conditions affecting mobility');
  }
  if (subject.activityLevel === 'sedentary') {
    riskFactors.push('Low activity level');
  }
  
  // Personalized recommendations
  const recommendations: string[] = [];
  if (normalizedCadence < 90) {
    recommendations.push('Consider increasing walking cadence for better efficiency');
  }
  if (walkingEfficiency < 70) {
    recommendations.push('Focus on improving gait pattern through targeted exercises');
  }
  if (bmiInfo.riskLevel === 'high') {
    recommendations.push('Weight management may improve gait efficiency');
  }
  if (subject.age > 50) {
    recommendations.push('Regular balance and strength training recommended');
  }
  
  return {
    cadence: avgCadence,
    strideLength: avgStrideLength,
    walkingSpeed: avgWalkingSpeed,
    normalizedCadence,
    normalizedStrideLength,
    walkingEfficiency,
    groundReactionForce,
    normalizedForce,
    leftRightAsymmetry: 5 + Math.random() * 10, // Placeholder
    stepTimeAsymmetry: 3 + Math.random() * 8, // Placeholder
    fatigueIndex: Math.max(0, 100 - walkingEfficiency),
    bmiCategory: bmiInfo.category,
    riskFactors,
    recommendations
  };
}

export function analyzePostureWithSubjectData(
  postureData: any,
  subject: SubjectData
): PostureAnalysisResult {
  // Basic posture metrics
  const forwardHeadAngle = postureData.forwardHeadAngle || 0;
  const shoulderTilt = postureData.shoulderTilt || 0;
  const spineAlignment = postureData.spineAlignment || 0;
  
  // Calculate base posture score
  const baseScore = Math.max(0, 100 - (forwardHeadAngle * 2 + Math.abs(shoulderTilt) * 3 + Math.abs(spineAlignment) * 2));
  
  // Age adjustments (older individuals may have different optimal ranges)
  const ageAdjustment = subject.age > 50 ? 5 : 0; // Slightly more lenient for older adults
  
  // Activity level adjustments
  const activityAdjustments = {
    sedentary: -10, // Less active individuals may have worse posture
    light: -5,
    moderate: 0,
    active: 5,
    very_active: 10
  };
  
  // BMI adjustments
  const bmi = calculateBMI(subject.height, subject.weight);
  const bmiAdjustment = bmi > 30 ? -5 : bmi < 18.5 ? -3 : 0;
  
  // Calculate normalized scores
  const normalizedPostureScore = Math.max(0, Math.min(100, baseScore + ageAdjustment + activityAdjustments[subject.activityLevel] + bmiAdjustment));
  const ageAdjustedScore = baseScore + ageAdjustment;
  const activityBasedScore = baseScore + activityAdjustments[subject.activityLevel];
  
  // Determine risk level
  let riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  if (normalizedPostureScore >= 80) riskLevel = 'low';
  else if (normalizedPostureScore >= 60) riskLevel = 'moderate';
  else if (normalizedPostureScore >= 40) riskLevel = 'high';
  else riskLevel = 'critical';
  
  // Ergonomic assessment
  const ergonomicScore = Math.max(0, normalizedPostureScore - 10); // Slightly more strict for ergonomics
  const workstationCompatibility = Math.max(0, normalizedPostureScore - 5);
  
  // Personalized recommendations based on subject profile
  const personalizedRecommendations: string[] = [];
  const equipmentSuggestions: string[] = [];
  
  if (forwardHeadAngle > 15) {
    personalizedRecommendations.push('Focus on chin tucks and neck strengthening exercises');
    if (subject.activityLevel === 'sedentary') {
      equipmentSuggestions.push('Consider an ergonomic monitor stand');
    }
  }
  
  if (Math.abs(shoulderTilt) > 5) {
    personalizedRecommendations.push('Practice shoulder blade squeezes and stretching');
    if (subject.age > 40) {
      personalizedRecommendions.push('Consider physical therapy for shoulder alignment');
    }
  }
  
  if (Math.abs(spineAlignment) > 10) {
    personalizedRecommendations.push('Core strengthening exercises recommended');
    if (subject.activityLevel === 'sedentary') {
      equipmentSuggestions.push('Ergonomic chair with lumbar support');
    }
  }
  
  // Subject-specific recommendations
  if (subject.age > 50) {
    personalizedRecommendations.push('Regular posture breaks every 30 minutes');
    equipmentSuggestions.push('Anti-fatigue mat if standing for long periods');
  }
  
  if (subject.medicalConditions.some(condition => 
    condition.toLowerCase().includes('back') || 
    condition.toLowerCase().includes('spine')
  )) {
    personalizedRecommendations.push('Consult with healthcare provider for posture modifications');
    equipmentSuggestions.push('Specialized ergonomic equipment may be beneficial');
  }
  
  if (subject.activityLevel === 'sedentary') {
    personalizedRecommendions.push('Increase daily movement and stretching');
    equipmentSuggestions.push('Standing desk or adjustable workstation');
  }
  
  return {
    forwardHeadAngle,
    shoulderTilt,
    spineAlignment,
    normalizedPostureScore,
    riskLevel,
    ergonomicScore,
    workstationCompatibility,
    ageAdjustedScore,
    activityBasedScore,
    personalizedRecommendations,
    equipmentSuggestions
  };
}

// Utility function to get subject data from localStorage
export function getStoredSubjectData(): SubjectData | null {
  try {
    const stored = localStorage.getItem('biomechai_subject_data');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading subject data:', error);
    return null;
  }
}

// Utility function to validate subject data completeness
export function isSubjectDataComplete(subject: SubjectData): boolean {
  return !!(subject.age && subject.height && subject.weight && subject.age > 0 && subject.height > 0 && subject.weight > 0);
}
