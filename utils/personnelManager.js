/**
 * FUEL FLUX Personnel Manager
 * Comprehensive personnel management system for employee tracking and performance
 */

class PersonnelManager {
  constructor() {
    this.employees = new Map();
    this.performanceMetrics = new Map();
    this.trainingPrograms = new Map();
    this.recruitmentPlans = new Map();
    this.attendanceRecords = new Map();
    this.payrollData = new Map();
    
    this.initialize();
  }

  /**
   * Initialize personnel manager
   */
  initialize() {
    this.setupEmployeeTypes();
    this.setupPerformanceMetrics();
    this.setupTrainingPrograms();
    this.setupRecruitmentProcess();
    this.loadStoredData();
  }

  /**
   * Setup employee types and roles
   */
  setupEmployeeTypes() {
    this.employeeTypes = {
      station_manager: {
        title: 'Station Manager',
        responsibilities: ['Overall station management', 'Team supervision', 'Financial oversight', 'Customer service'],
        skills: ['Leadership', 'Financial management', 'Customer service', 'Operations management'],
        salaryRange: { min: 25000, max: 45000 },
        performanceMetrics: ['team_performance', 'customer_satisfaction', 'financial_targets', 'operational_efficiency']
      },
      cashier: {
        title: 'Cashier',
        responsibilities: ['Customer transactions', 'Cash handling', 'Shop sales', 'Customer service'],
        skills: ['Cash handling', 'Customer service', 'Basic accounting', 'Communication'],
        salaryRange: { min: 12000, max: 20000 },
        performanceMetrics: ['transaction_speed', 'customer_satisfaction', 'sales_targets', 'accuracy']
      },
      pump_attendant: {
        title: 'Pump Attendant',
        responsibilities: ['Fuel dispensing', 'Vehicle assistance', 'Site maintenance', 'Safety compliance'],
        skills: ['Safety procedures', 'Customer service', 'Equipment operation', 'Attention to detail'],
        salaryRange: { min: 10000, max: 18000 },
        performanceMetrics: ['service_speed', 'safety_compliance', 'customer_satisfaction', 'maintenance_tasks']
      },
      supervisor: {
        title: 'Supervisor',
        responsibilities: ['Shift management', 'Team coordination', 'Quality control', 'Training coordination'],
        skills: ['Leadership', 'Problem solving', 'Communication', 'Technical knowledge'],
        salaryRange: { min: 18000, max: 30000 },
        performanceMetrics: ['team_performance', 'shift_efficiency', 'quality_standards', 'training_effectiveness']
      }
    };
  }

  /**
   * Setup performance metrics
   */
  setupPerformanceMetrics() {
    this.metrics = {
      // Operational metrics
      efficiency: {
        name: 'Operational Efficiency',
        weight: 25,
        calculation: this.calculateEfficiencyMetric.bind(this)
      },
      productivity: {
        name: 'Productivity Score',
        weight: 20,
        calculation: this.calculateProductivityMetric.bind(this)
      },
      quality: {
        name: 'Quality Standards',
        weight: 20,
        calculation: this.calculateQualityMetric.bind(this)
      },
      attendance: {
        name: 'Attendance Rate',
        weight: 15,
        calculation: this.calculateAttendanceMetric.bind(this)
      },
      customer_satisfaction: {
        name: 'Customer Satisfaction',
        weight: 20,
        calculation: this.calculateCustomerSatisfactionMetric.bind(this)
      }
    };
  }

  /**
   * Setup training programs
   */
  setupTrainingPrograms() {
    this.trainingPrograms.set('safety_training', {
      id: 'safety_training',
      name: 'Safety & Compliance Training',
      duration: '4 hours',
      frequency: 'quarterly',
      description: 'Comprehensive safety training covering fuel handling, emergency procedures, and compliance requirements',
      skills: ['safety_procedures', 'emergency_response', 'compliance_knowledge'],
      completionRequired: true
    });

    this.trainingPrograms.set('customer_service', {
      id: 'customer_service',
      name: 'Advanced Customer Service',
      duration: '8 hours',
      frequency: 'annually',
      description: 'Advanced customer service skills, conflict resolution, and communication techniques',
      skills: ['communication', 'conflict_resolution', 'customer_engagement'],
      completionRequired: true
    });

    this.trainingPrograms.set('technical_skills', {
      id: 'technical_skills',
      name: 'Technical Skills Development',
      duration: '16 hours',
      frequency: 'biannually',
      description: 'Equipment operation, maintenance procedures, and technical troubleshooting',
      skills: ['equipment_operation', 'maintenance', 'technical_troubleshooting'],
      completionRequired: false
    });

    this.trainingPrograms.set('leadership_development', {
      id: 'leadership_development',
      name: 'Leadership Development Program',
      duration: '20 hours',
      frequency: 'annually',
      description: 'Leadership skills, team management, and decision-making for supervisory roles',
      skills: ['leadership', 'team_management', 'decision_making'],
      completionRequired: false
    });
  }

  /**
   * Setup recruitment process
   */
  setupRecruitmentProcess() {
    this.recruitmentStages = [
      'application_received',
      'initial_screening',
      'interview_scheduled',
      'interview_completed',
      'reference_check',
      'offer_made',
      'offer_accepted',
      'onboarding_completed'
    ];

    this.recruitmentMetrics = {
      time_to_hire: {
        name: 'Time to Hire',
        target: 14, // days
        calculation: this.calculateTimeToHire.bind(this)
      },
      cost_per_hire: {
        name: 'Cost per Hire',
        target: 5000, // Rand
        calculation: this.calculateCostPerHire.bind(this)
      },
      quality_of_hire: {
        name: 'Quality of Hire',
        target: 85, // percentage
        calculation: this.calculateQualityOfHire.bind(this)
      }
    };
  }

  /**
   * Add new employee
   * @param {Object} employeeData - Employee information
   * @returns {string} Employee ID
   */
  addEmployee(employeeData) {
    const employeeId = this.generateEmployeeId();
    const employee = {
      id: employeeId,
      personalInfo: {
        firstName: employeeData.firstName || '',
        lastName: employeeData.lastName || '',
        email: employeeData.email || '',
        phone: employeeData.phone || '',
        address: employeeData.address || '',
        emergencyContact: employeeData.emergencyContact || {}
      },
      employment: {
        position: employeeData.position || '',
        employeeType: employeeData.employeeType || '',
        startDate: employeeData.startDate || new Date().toISOString(),
        salary: employeeData.salary || 0,
        benefits: employeeData.benefits || [],
        contractType: employeeData.contractType || 'permanent',
        probationPeriod: employeeData.probationPeriod || 3
      },
      performance: {
        currentScore: 0,
        historicalScores: [],
        metrics: {},
        lastReview: null,
        nextReview: this.calculateNextReview()
      },
      training: {
        completed: [],
        inProgress: [],
        required: this.getRequiredTrainings(employeeData.employeeType),
        certificates: []
      },
      attendance: {
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        leaveBalance: employeeData.leaveBalance || 25
      },
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.employees.set(employeeId, employee);
    this.saveEmployees();
    return employeeId;
  }

  /**
   * Update employee information
   * @param {string} employeeId - Employee ID
   * @param {Object} updates - Updates to apply
   */
  updateEmployee(employeeId, updates) {
    const employee = this.employees.get(employeeId);
    if (!employee) {
      throw new Error(`Employee not found: ${employeeId}`);
    }

    // Update employee data
    Object.keys(updates).forEach(key => {
      if (key in employee) {
        employee[key] = { ...employee[key], ...updates[key] };
      }
    });

    employee.updatedAt = new Date().toISOString();
    this.employees.set(employeeId, employee);
    this.saveEmployees();
  }

  /**
   * Record employee performance
   * @param {string} employeeId - Employee ID
   * @param {Object} performanceData - Performance data
   */
  recordPerformance(employeeId, performanceData) {
    const employee = this.employees.get(employeeId);
    if (!employee) {
      throw new Error(`Employee not found: ${employeeId}`);
    }

    // Calculate performance score
    const performanceScore = this.calculateOverallPerformance(performanceData);
    
    // Update performance record
    employee.performance = {
      ...employee.performance,
      currentScore: performanceScore,
      historicalScores: [...employee.performance.historicalScores, {
        score: performanceScore,
        date: new Date().toISOString(),
        metrics: performanceData
      }],
      lastReview: new Date().toISOString(),
      nextReview: this.calculateNextReview()
    };

    this.employees.set(employeeId, employee);
    this.saveEmployees();

    return performanceScore;
  }

  /**
   * Record attendance
   * @param {string} employeeId - Employee ID
   * @param {Object} attendanceData - Attendance data
   */
  recordAttendance(employeeId, attendanceData) {
    const employee = this.employees.get(employeeId);
    if (!employee) {
      throw new Error(`Employee not found: ${employeeId}`);
    }

    const { date, status, timeIn, timeOut, notes } = attendanceData;
    const attendanceRecord = {
      employeeId,
      date,
      status, // present, absent, late, leave
      timeIn,
      timeOut,
      notes,
      recordedAt: new Date().toISOString()
    };

    // Update employee attendance
    if (status === 'present') {
      employee.attendance.presentDays++;
    } else if (status === 'absent') {
      employee.attendance.absentDays++;
    } else if (status === 'late') {
      employee.attendance.lateDays++;
    }

    employee.attendance.totalDays++;
    this.employees.set(employeeId, employee);

    // Store attendance record
    const attendanceKey = `${employeeId}_${date}`;
    this.attendanceRecords.set(attendanceKey, attendanceRecord);

    this.saveEmployees();
    this.saveAttendanceRecords();

    return attendanceRecord;
  }

  /**
   * Add training completion
   * @param {string} employeeId - Employee ID
   * @param {string} trainingId - Training program ID
   * @param {Object} completionData - Training completion data
   */
  addTrainingCompletion(employeeId, trainingId, completionData) {
    const employee = this.employees.get(employeeId);
    const training = this.trainingPrograms.get(trainingId);

    if (!employee) {
      throw new Error(`Employee not found: ${employeeId}`);
    }

    if (!training) {
      throw new Error(`Training program not found: ${trainingId}`);
    }

    const completion = {
      trainingId,
      trainingName: training.name,
      completedAt: completionData.completedAt || new Date().toISOString(),
      score: completionData.score || 100,
      certificate: completionData.certificate || null,
      validUntil: completionData.validUntil || this.calculateTrainingValidity(trainingId),
      notes: completionData.notes || ''
    };

    // Remove from in-progress and add to completed
    employee.training.inProgress = employee.training.inProgress.filter(id => id !== trainingId);
    employee.training.completed.push(completion);

    // Add certificate if provided
    if (completionData.certificate) {
      employee.training.certificates.push({
        id: completion.trainingId,
        name: training.name,
        issuedAt: completion.completedAt,
        validUntil: completion.validUntil
      });
    }

    this.employees.set(employeeId, employee);
    this.saveEmployees();

    return completion;
  }

  /**
   * Generate personnel report
   * @param {Object} options - Report options
   * @returns {Object} Personnel report
   */
  generatePersonnelReport(options = {}) {
    const employees = Array.from(this.employees.values());
    const activeEmployees = employees.filter(emp => emp.status === 'active');

    const report = {
      summary: {
        totalEmployees: employees.length,
        activeEmployees: activeEmployees.length,
        averagePerformance: this.calculateAveragePerformance(activeEmployees),
        turnoverRate: this.calculateTurnoverRate(),
        averageSalary: this.calculateAverageSalary(activeEmployees)
      },
      performance: {
        topPerformers: this.getTopPerformers(activeEmployees, 5),
        needsImprovement: this.getEmployeesNeedingImprovement(activeEmployees),
        performanceDistribution: this.getPerformanceDistribution(activeEmployees)
      },
      training: {
        completedTraining: this.getTrainingCompletionStats(),
        upcomingTraining: this.getUpcomingTraining(),
        trainingGaps: this.identifyTrainingGaps()
      },
      recruitment: {
        openPositions: this.recruitmentPlans.size,
        activeRecruitments: this.getActiveRecruitments(),
        recruitmentMetrics: this.calculateRecruitmentMetrics()
      },
      recommendations: this.generatePersonnelRecommendations(activeEmployees)
    };

    return report;
  }

  /**
   * Calculate overall performance score
   * @param {Object} performanceData - Performance metrics
   * @returns {number} Overall score
   */
  calculateOverallPerformance(performanceData) {
    let totalScore = 0;
    let totalWeight = 0;

    Object.keys(this.metrics).forEach(metricKey => {
      const metric = this.metrics[metricKey];
      if (performanceData[metricKey] !== undefined) {
        const score = metric.calculation(performanceData[metricKey]);
        totalScore += score * metric.weight;
        totalWeight += metric.weight;
      }
    });

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Calculate efficiency metric
   * @param {number} value - Efficiency value
   * @returns {number} Calculated score
   */
  calculateEfficiencyMetric(value) {
    // Efficiency is typically 0-100, convert to 0-100 score
    return Math.min(100, Math.max(0, value));
  }

  /**
   * Calculate productivity metric
   * @param {number} value - Productivity value
   * @returns {number} Calculated score
   */
  calculateProductivityMetric(value) {
    return Math.min(100, Math.max(0, value));
  }

  /**
   * Calculate quality metric
   * @param {number} value - Quality value
   * @returns {number} Calculated score
   */
  calculateQualityMetric(value) {
    return Math.min(100, Math.max(0, value));
  }

  /**
   * Calculate attendance metric
   * @param {number} value - Attendance percentage
   * @returns {number} Calculated score
   */
  calculateAttendanceMetric(value) {
    return Math.min(100, Math.max(0, value));
  }

  /**
   * Calculate customer satisfaction metric
   * @param {number} value - Customer satisfaction score
   * @returns {number} Calculated score
   */
  calculateCustomerSatisfactionMetric(value) {
    return Math.min(100, Math.max(0, value));
  }

  /**
   * Get required trainings for employee type
   * @param {string} employeeType - Type of employee
   * @returns {Array} Required training IDs
   */
  getRequiredTrainings(employeeType) {
    const required = [];
    this.trainingPrograms.forEach(program => {
      if (program.completionRequired) {
        required.push(program.id);
      }
    });
    return required;
  }

  /**
   * Calculate next review date
   * @returns {string} Next review date
   */
  calculateNextReview() {
    const nextReview = new Date();
    nextReview.setMonth(nextReview.getMonth() + 6); // 6-month review cycle
    return nextReview.toISOString();
  }

  /**
   * Calculate training validity period
   * @param {string} trainingId - Training program ID
   * @returns {string} Valid until date
   */
  calculateTrainingValidity(trainingId) {
    const training = this.trainingPrograms.get(trainingId);
    if (!training) return null;

    const validUntil = new Date();
    if (training.frequency === 'quarterly') {
      validUntil.setMonth(validUntil.getMonth() + 3);
    } else if (training.frequency === 'biannually') {
      validUntil.setMonth(validUntil.getMonth() + 6);
    } else if (training.frequency === 'annually') {
      validUntil.setFullYear(validUntil.getFullYear() + 1);
    }

    return validUntil.toISOString();
  }

  /**
   * Calculate average performance
   * @param {Array} employees - List of employees
   * @returns {number} Average performance score
   */
  calculateAveragePerformance(employees) {
    if (employees.length === 0) return 0;
    const totalScore = employees.reduce((sum, emp) => sum + emp.performance.currentScore, 0);
    return totalScore / employees.length;
  }

  /**
   * Calculate turnover rate
   * @returns {number} Turnover rate percentage
   */
  calculateTurnoverRate() {
    const totalEmployees = this.employees.size;
    const inactiveEmployees = Array.from(this.employees.values()).filter(emp => emp.status === 'inactive').length;
    return totalEmployees > 0 ? (inactiveEmployees / totalEmployees) * 100 : 0;
  }

  /**
   * Calculate average salary
   * @param {Array} employees - List of employees
   * @returns {number} Average salary
   */
  calculateAverageSalary(employees) {
    if (employees.length === 0) return 0;
    const totalSalary = employees.reduce((sum, emp) => sum + emp.employment.salary, 0);
    return totalSalary / employees.length;
  }

  /**
   * Get top performers
   * @param {Array} employees - List of employees
   * @param {number} count - Number of top performers to return
   * @returns {Array} Top performers
   */
  getTopPerformers(employees, count = 5) {
    return employees
      .sort((a, b) => b.performance.currentScore - a.performance.currentScore)
      .slice(0, count)
      .map(emp => ({
        id: emp.id,
        name: `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`,
        position: emp.employment.position,
        performanceScore: emp.performance.currentScore
      }));
  }

  /**
   * Get employees needing improvement
   * @param {Array} employees - List of employees
   * @returns {Array} Employees needing improvement
   */
  getEmployeesNeedingImprovement(employees) {
    return employees
      .filter(emp => emp.performance.currentScore < 70)
      .map(emp => ({
        id: emp.id,
        name: `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`,
        position: emp.employment.position,
        performanceScore: emp.performance.currentScore,
        recommendations: this.generateImprovementRecommendations(emp)
      }));
  }

  /**
   * Generate improvement recommendations
   * @param {Object} employee - Employee data
   * @returns {Array} Recommendations
   */
  generateImprovementRecommendations(employee) {
    const recommendations = [];

    if (employee.performance.currentScore < 60) {
      recommendations.push('Immediate performance improvement plan required');
    }

    if (employee.attendance.presentDays / employee.attendance.totalDays < 0.9) {
      recommendations.push('Address attendance issues');
    }

    if (employee.training.required.length > employee.training.completed.length) {
      recommendations.push('Complete required training programs');
    }

    return recommendations;
  }

  /**
   * Generate personnel recommendations
   * @param {Array} employees - List of employees
   * @returns {Object} Recommendations
   */
  generatePersonnelRecommendations(employees) {
    const recommendations = {
      immediate: [],
      shortTerm: [],
      longTerm: []
    };

    // Immediate recommendations
    const lowPerformers = employees.filter(emp => emp.performance.currentScore < 60);
    if (lowPerformers.length > 0) {
      recommendations.immediate.push(`Address performance issues for ${lowPerformers.length} employees`);
    }

    // Short-term recommendations
    const trainingNeeds = employees.filter(emp => 
      emp.training.required.length > emp.training.completed.length
    );
    if (trainingNeeds.length > 0) {
      recommendations.shortTerm.push(`Schedule training for ${trainingNeeds.length} employees`);
    }

    // Long-term recommendations
    const potentialLeaders = employees.filter(emp => 
      emp.performance.currentScore > 85 && emp.employment.position !== 'station_manager'
    );
    if (potentialLeaders.length > 0) {
      recommendations.longTerm.push(`Identify ${potentialLeaders.length} potential leaders for development`);
    }

    return recommendations;
  }

  // Helper methods
  generateEmployeeId() {
    return `EMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  saveEmployees() {
    localStorage.setItem('fuelFlux_employees', JSON.stringify(Array.from(this.employees.entries())));
  }

  saveAttendanceRecords() {
    localStorage.setItem('fuelFlux_attendance', JSON.stringify(Array.from(this.attendanceRecords.entries())));
  }

  loadStoredData() {
    // Load employees
    const savedEmployees = localStorage.getItem('fuelFlux_employees');
    if (savedEmployees) {
      this.employees = new Map(JSON.parse(savedEmployees));
    }

    // Load attendance records
    const savedAttendance = localStorage.getItem('fuelFlux_attendance');
    if (savedAttendance) {
      this.attendanceRecords = new Map(JSON.parse(savedAttendance));
    }
  }
}

// Global personnel manager instance
window.personnelManager = new PersonnelManager();

// export default window.personnelManager;
