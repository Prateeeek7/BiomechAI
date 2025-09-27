import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Weight, Ruler, Calendar, Activity, Heart, Zap, Save, Edit3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { toast } from "sonner";

export interface SubjectData {
  name?: string;
  age: number;
  height: number; // in cm
  weight: number; // in kg
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  medicalConditions: string[];
  goals: string[];
  dominantLeg: 'left' | 'right';
  units: 'metric' | 'imperial';
}

interface SubjectDetailsProps {
  onSubjectUpdate: (subject: SubjectData) => void;
  initialData?: SubjectData;
  compact?: boolean;
}

const defaultSubjectData: SubjectData = {
  age: 25,
  height: 170, // 170cm default
  weight: 70, // 70kg default
  gender: 'male',
  activityLevel: 'moderate',
  medicalConditions: [],
  goals: [],
  dominantLeg: 'right',
  units: 'metric'
};

export default function SubjectDetails({ onSubjectUpdate, initialData, compact = false }: SubjectDetailsProps) {
  const [subjectData, setSubjectData] = useState<SubjectData>(initialData || defaultSubjectData);
  const [isEditing, setIsEditing] = useState(!initialData);
  const [newCondition, setNewCondition] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Calculate derived metrics
  const calculateBMI = () => {
    const heightInM = subjectData.height / 100;
    return subjectData.weight / (heightInM * heightInM);
  };

  const calculateIdealWeight = () => {
    // Using Devine formula: Men: 50kg + 2.3kg per inch over 5ft, Women: 45.5kg + 2.3kg per inch over 5ft
    const heightInInches = subjectData.height / 2.54;
    const baseWeight = subjectData.gender === 'male' ? 50 : 45.5;
    const additionalWeight = Math.max(0, (heightInInches - 60) * 2.3);
    return baseWeight + additionalWeight;
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20' };
    if (bmi < 25) return { category: 'Normal', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' };
    return { category: 'Obese', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20' };
  };

  const getActivityMultiplier = () => {
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    return multipliers[subjectData.activityLevel];
  };

  const calculateBasalMetabolicRate = () => {
    // Mifflin-St Jeor Equation
    const bmr = subjectData.gender === 'male' 
      ? (10 * subjectData.weight) + (6.25 * subjectData.height) - (5 * subjectData.age) + 5
      : (10 * subjectData.weight) + (6.25 * subjectData.height) - (5 * subjectData.age) - 161;
    return Math.round(bmr * getActivityMultiplier());
  };

  useEffect(() => {
    if (initialData) {
      setSubjectData(initialData);
      setIsEditing(false);
    }
  }, [initialData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validate required fields
      if (!subjectData.age || !subjectData.height || !subjectData.weight) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Save to localStorage for persistence
      localStorage.setItem('biomechai_subject_data', JSON.stringify(subjectData));
      
      // Notify parent component
      onSubjectUpdate(subjectData);
      
      setIsEditing(false);
      toast.success("Subject details saved successfully!");
    } catch (error) {
      console.error('Error saving subject data:', error);
      toast.error("Failed to save subject details");
    } finally {
      setIsSaving(false);
    }
  };

  const addMedicalCondition = () => {
    if (newCondition.trim() && !subjectData.medicalConditions.includes(newCondition.trim())) {
      setSubjectData(prev => ({
        ...prev,
        medicalConditions: [...prev.medicalConditions, newCondition.trim()]
      }));
      setNewCondition('');
    }
  };

  const removeMedicalCondition = (condition: string) => {
    setSubjectData(prev => ({
      ...prev,
      medicalConditions: prev.medicalConditions.filter(c => c !== condition)
    }));
  };

  const addGoal = () => {
    if (newGoal.trim() && !subjectData.goals.includes(newGoal.trim())) {
      setSubjectData(prev => ({
        ...prev,
        goals: [...prev.goals, newGoal.trim()]
      }));
      setNewGoal('');
    }
  };

  const removeGoal = (goal: string) => {
    setSubjectData(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g !== goal)
    }));
  };

  const bmi = calculateBMI();
  const bmiCategory = getBMICategory(bmi);
  const idealWeight = calculateIdealWeight();
  const dailyCalories = calculateBasalMetabolicRate();

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  if (compact && !isEditing) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-electric-light dark:text-electric-dark" />
                <span>Subject Details</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Age</p>
                <p className="font-semibold">{subjectData.age} years</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Height</p>
                <p className="font-semibold">{subjectData.height} cm</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Weight</p>
                <p className="font-semibold">{subjectData.weight} kg</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">BMI</p>
                <p className={cn("font-semibold", bmiCategory.color)}>
                  {bmi.toFixed(1)} ({bmiCategory.category})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-electric-light dark:text-electric-dark" />
              <span>Subject Details</span>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                key="edit"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="space-y-6"
              >
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={subjectData.name || ''}
                      onChange={(e) => setSubjectData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter subject name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-electric-light focus:border-electric-light dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Age <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={subjectData.age}
                      onChange={(e) => setSubjectData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-electric-light focus:border-electric-light dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gender
                    </label>
                    <select
                      value={subjectData.gender}
                      onChange={(e) => setSubjectData(prev => ({ ...prev, gender: e.target.value as SubjectData['gender'] }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-electric-light focus:border-electric-light dark:bg-gray-700 dark:text-white"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Height (cm) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="100"
                      max="250"
                      value={subjectData.height}
                      onChange={(e) => setSubjectData(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-electric-light focus:border-electric-light dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Weight (kg) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="20"
                      max="300"
                      step="0.1"
                      value={subjectData.weight}
                      onChange={(e) => setSubjectData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-electric-light focus:border-electric-light dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dominant Leg
                    </label>
                    <select
                      value={subjectData.dominantLeg}
                      onChange={(e) => setSubjectData(prev => ({ ...prev, dominantLeg: e.target.value as SubjectData['dominantLeg'] }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-electric-light focus:border-electric-light dark:bg-gray-700 dark:text-white"
                    >
                      <option value="right">Right</option>
                      <option value="left">Left</option>
                    </select>
                  </div>
                </div>

                {/* Activity Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Activity Level
                  </label>
                  <select
                    value={subjectData.activityLevel}
                    onChange={(e) => setSubjectData(prev => ({ ...prev, activityLevel: e.target.value as SubjectData['activityLevel'] }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-electric-light focus:border-electric-light dark:bg-gray-700 dark:text-white"
                  >
                    <option value="sedentary">Sedentary (little to no exercise)</option>
                    <option value="light">Lightly Active (light exercise 1-3 days/week)</option>
                    <option value="moderate">Moderately Active (moderate exercise 3-5 days/week)</option>
                    <option value="active">Very Active (hard exercise 6-7 days/week)</option>
                    <option value="very_active">Extra Active (very hard exercise & physical job)</option>
                  </select>
                </div>

                {/* Medical Conditions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Medical Conditions (Optional)
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newCondition}
                      onChange={(e) => setNewCondition(e.target.value)}
                      placeholder="Add medical condition"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-electric-light focus:border-electric-light dark:bg-gray-700 dark:text-white"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMedicalCondition())}
                    />
                    <Button type="button" onClick={addMedicalCondition} size="sm">
                      Add
                    </Button>
                  </div>
                  {subjectData.medicalConditions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {subjectData.medicalConditions.map((condition, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                        >
                          {condition}
                          <button
                            type="button"
                            onClick={() => removeMedicalCondition(condition)}
                            className="ml-2 text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Goals */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Health Goals (Optional)
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      placeholder="Add health goal"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-electric-light focus:border-electric-light dark:bg-gray-700 dark:text-white"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                    />
                    <Button type="button" onClick={addGoal} size="sm">
                      Add
                    </Button>
                  </div>
                  {subjectData.goals.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {subjectData.goals.map((goal, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                        >
                          {goal}
                          <button
                            type="button"
                            onClick={() => removeGoal(goal)}
                            className="ml-2 text-green-600 hover:text-green-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Details
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="view"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="space-y-6"
              >
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Age</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{subjectData.age}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-300">years</p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Ruler className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">Height</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">{subjectData.height}</p>
                    <p className="text-xs text-green-600 dark:text-green-300">cm</p>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Weight className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Weight</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{subjectData.weight}</p>
                    <p className="text-xs text-purple-600 dark:text-purple-300">kg</p>
                  </div>

                  <div className={cn("p-4 rounded-lg", bmiCategory.bgColor)}>
                    <div className="flex items-center space-x-2 mb-2">
                      <Activity className="h-5 w-5" />
                      <span className={cn("text-sm font-medium", bmiCategory.color)}>BMI</span>
                    </div>
                    <p className={cn("text-2xl font-bold", bmiCategory.color)}>{bmi.toFixed(1)}</p>
                    <p className={cn("text-xs", bmiCategory.color)}>{bmiCategory.category}</p>
                  </div>
                </div>

                {/* Additional Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Heart className="h-5 w-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily Calories</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{dailyCalories}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">kcal/day (BMR × Activity)</p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Zap className="h-5 w-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ideal Weight</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{idealWeight.toFixed(1)}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">kg (Devine formula)</p>
                  </div>
                </div>

                {/* Additional Info */}
                {(subjectData.medicalConditions.length > 0 || subjectData.goals.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subjectData.medicalConditions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Medical Conditions</h4>
                        <div className="flex flex-wrap gap-2">
                          {subjectData.medicalConditions.map((condition, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                            >
                              {condition}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {subjectData.goals.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Health Goals</h4>
                        <div className="flex flex-wrap gap-2">
                          {subjectData.goals.map((goal, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                            >
                              {goal}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
