
import { GoogleGenAI } from "@google/genai";

// --- Constants ---
const HealthIssue = {
  DIABETES: "Diabetes",
  BLOOD_PRESSURE: "High Blood Pressure",
  HEART_DISEASE: "Heart Disease",
  ASTHMA: "Asthma",
  OBESITY: "Obesity",
  THYROID: "Thyroid Disorder",
  OTHER: "Other"
};

const HEALTH_ISSUES_OPTIONS = [
  HealthIssue.DIABETES, HealthIssue.BLOOD_PRESSURE, HealthIssue.HEART_DISEASE,
  HealthIssue.ASTHMA, HealthIssue.OBESITY, HealthIssue.THYROID, HealthIssue.OTHER,
];

const MOCK_DOCTORS = [
  { id: "1", name: "Dr. Emily Carter", specialty: "Endocrinologist", address: "123 Health St, Wellness City, CA", phone: "555-0101", relevantIssues: [HealthIssue.DIABETES, HealthIssue.THYROID, HealthIssue.OBESITY], lat: 34.0522, lon: -118.2437 },
  { id: "2", name: "Dr. Johnathan Lee", specialty: "Cardiologist", address: "456 Heartbeat Ave, Vitality Town, TX", phone: "555-0102", relevantIssues: [HealthIssue.HEART_DISEASE, HealthIssue.BLOOD_PRESSURE, HealthIssue.OBESITY], lat: 29.7604, lon: -95.3698 },
  { id: "3", name: "Dr. Sarah Miller", specialty: "Pulmonologist", address: "789 Breath Easy Rd, Airy Village, FL", phone: "555-0103", relevantIssues: [HealthIssue.ASTHMA], lat: 28.5383, lon: -81.3792 },
  { id: "4", name: "Dr. Ben Green", specialty: "General Practitioner", address: "101 Wellbeing Ln, Serene Suburb, NY", phone: "555-0104", relevantIssues: [HealthIssue.DIABETES, HealthIssue.BLOOD_PRESSURE, HealthIssue.OBESITY], lat: 40.7128, lon: -74.0060},
  { id: "5", name: "Dr. Olivia Chen", specialty: "Nutritionist & Wellness Coach", address: "220 Healthy Way, Fit City, CA", phone: "555-0105", relevantIssues: [HealthIssue.OBESITY, HealthIssue.DIABETES], lat: 34.0522, lon: -118.2437 }
];

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const SEVERITY_OPTIONS = ['Mild', 'Moderate', 'Severe'];
const ACTIVITY_LEVEL_OPTIONS = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'];
const SMOKER_OPTIONS = ['Yes', 'No'];

const API_KEY_ERROR_MESSAGE = "API Key for Gemini is not configured. Please ensure the API_KEY environment variable is set and accessible in your execution environment.";

const FormStep = { HEALTH_ISSUE: 1, PERSONAL_DATA: 2, LOCATION: 3, RESULTS: 4 };

const STEPS_CONFIG = [
  { id: FormStep.HEALTH_ISSUE, label: "Health Issue", iconFn: getHeartIconSVG },
  { id: FormStep.PERSONAL_DATA, label: "Personal Info", iconFn: getUserIconSVG },
  { id: FormStep.LOCATION, label: "Location", iconFn: getMapPinIconSVG },
  { id: FormStep.RESULTS, label: "Guidance", iconFn: getSparklesIconSVG },
];


// --- State Variables ---
let currentStep = FormStep.HEALTH_ISSUE;
const initialUserData = {
  healthIssue: '', customHealthIssue: '', age: '', gender: '',
  severity: '', activityLevel: '', smoker: '', medication: '',
  location: null, manualLocationInput: '',
};
let userData = { ...initialUserData };
let generatedAdvice = null;
let doctors = [];
let isLoading = false;
let apiError = null; // Used for API specific errors displayed on results page
let globalError = null; // Used for general errors like API key missing
let isApiKeyMissing = false;
let isFetchingGeo = false;


// --- DOM Element References ---
let healthIssueSelect, customHealthIssueContainer, customHealthIssueInput, healthIssueError, healthIssueNextBtn;
let ageInput, genderSelect, severitySelect, activityLevelSelect, smokerSelect, medicationInput;
let ageError, genderError, severityError, activityLevelError, smokerError;
let personalDataPrevBtn, personalDataNextBtn;
let locationAcquiredMessage, clearLocationBtn, locationError, geoLocationBtn, manualLocationInput;
let locationPrevBtn, locationSubmitBtn, locationSubmitBtnText, geoLocationBtnIconContainer;
let stepHealthIssue, stepPersonalData, stepLocation, stepResults;
let resultsLoadingSpinner, resultsApiErrorContainer, resultsSuccessContainer, resultsTitle, resultsSubtitle;
let dietPlanDiv, exerciseRecommendationsDiv, dailyHealthTipsDiv, doctorsListDiv, noDoctorsMessage, resultsDisclaimer;
let startOverBtn;
let stepIndicatorContainer, globalLoadingSpinner, globalErrorMessageContainer, formStepsContainer;
let headerIconContainer, dietPlanIcon, exerciseIcon, healthTipsIcon, doctorsListIcon;
let healthIssueNextIcon, personalDataPrevIcon, personalDataNextIcon, locationPrevIcon;


// --- Gemini API ---
let ai;
const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';

// --- Helper Functions: SVG Icons ---
function getChevronLeftIconSVG(className = "w-5 h-5") {
  return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="${className}"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>`;
}
function getChevronRightIconSVG(className = "w-5 h-5") {
  return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="${className}"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>`;
}
function getCheckIconSVG(className = "w-6 h-6") {
  return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="${className}"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>`;
}
function getHeartIconSVG(className = "w-6 h-6") {
  return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="${className}"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>`;
}
function getUserIconSVG(className = "w-6 h-6") {
  return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="${className}"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>`;
}
function getMapPinIconSVG(className = "w-6 h-6") {
  return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="${className}"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>`;
}
function getSparklesIconSVG(className = "w-6 h-6") {
  return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="${className}"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12L15.404 11.187a4.5 4.5 0 00-3.09-3.09L11.25 5.25l-.813 2.846a4.5 4.5 0 00-3.09 3.09L4.5 12l2.846.813a4.5 4.5 0 003.09 3.09L11.25 18.75l.813-2.846a4.5 4.5 0 003.09-3.09L18.25 12zM12 2.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09L12 15.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L5.25 9l2.846-.813A4.5 4.5 0 0011.187 5.097L12 2.25z" /></svg>`;
}

function getLoadingSpinnerSVG(size = 'md', color = 'sky-600') {
    const sizeClasses = { sm: 'w-6 h-6 border-2', md: 'w-10 h-10 border-4', lg: 'w-16 h-16 border-4' };
    return `<div class="${sizeClasses[size]} border-${color} border-t-transparent rounded-full loading-spinner-animation"></div>`;
}

// --- DOM Update Functions ---
function updateStepIndicator() {
  if (!stepIndicatorContainer) return;
  let html = '<ol role="list">';
  STEPS_CONFIG.forEach((step, index) => {
    const isCompleted = currentStep > step.id;
    const isActive = currentStep === step.id;
    html += `
      <li class="relative flex-1">
        ${index < STEPS_CONFIG.length - 1 ? `<div class="step-line ${isCompleted ? 'completed' : ''}" aria-hidden="true"></div>` : ''}
        <div class="step-item-content">
          <div class="step-circle ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}">
            ${isCompleted ? getCheckIconSVG('h-6 w-6 text-white') : step.iconFn(`h-6 w-6 ${isActive ? 'text-sky-600' : 'text-slate-400'}`)}
          </div>
          <p class="step-label ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}">${step.label}</p>
        </div>
      </li>`;
  });
  html += '</ol>';
  stepIndicatorContainer.innerHTML = html;
  stepIndicatorContainer.classList.toggle('hidden', currentStep === FormStep.RESULTS);
}

function showStep(stepId) {
  [stepHealthIssue, stepPersonalData, stepLocation, stepResults].forEach(stepEl => {
    if (stepEl) { // Check if element exists
        stepEl.classList.remove('active', 'animate-fadeIn');
        stepEl.classList.add('hidden');
    }
  });
  
  globalLoadingSpinner.classList.add('hidden');
  formStepsContainer.classList.remove('hidden');

  let activeStepEl;
  switch (stepId) {
    case FormStep.HEALTH_ISSUE: activeStepEl = stepHealthIssue; break;
    case FormStep.PERSONAL_DATA: activeStepEl = stepPersonalData; break;
    case FormStep.LOCATION: activeStepEl = stepLocation; break;
    case FormStep.RESULTS: activeStepEl = stepResults; break;
  }

  if (activeStepEl) {
    activeStepEl.classList.remove('hidden');
    activeStepEl.classList.add('active', 'animate-fadeIn');
  }
  updateStepIndicator();
  clearGlobalError(); // Clear general errors when changing steps
}

function populateSelect(selectElement, options, includeEmptyOption = true, emptyOptionText = "-- Select --") {
  if (!selectElement) return;
  selectElement.innerHTML = ''; // Clear existing options
  if (includeEmptyOption) {
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = emptyOptionText;
    defaultOption.disabled = true;
    defaultOption.selected = true;
    selectElement.appendChild(defaultOption);
  }
  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt;
    selectElement.appendChild(option);
  });
}

function displayInputError(element, message) {
  if (element) {
    element.textContent = message;
    element.classList.remove('hidden');
  }
}

function clearInputError(element) {
  if (element) {
    element.textContent = '';
    element.classList.add('hidden');
  }
}

function setGlobalLoading(show, text = "Loading...") {
    isLoading = show;
    if (show) {
        globalLoadingSpinner.innerHTML = `
            ${getLoadingSpinnerSVG('lg', 'sky-600')}
            ${text ? `<p class="text-sky-700 mt-2">${text}</p>` : ''}
        `;
        globalLoadingSpinner.classList.remove('hidden');
        formStepsContainer.classList.add('hidden'); // Hide form steps container
        globalErrorMessageContainer.classList.add('hidden');
    } else {
        globalLoadingSpinner.classList.add('hidden');
        if (!globalError && !isApiKeyMissing) { // Only show form if no overriding global error
             formStepsContainer.classList.remove('hidden');
        }
    }
}


function displayGlobalError(message) {
    globalError = message;
    if (message) {
        globalErrorMessageContainer.textContent = message;
        globalErrorMessageContainer.classList.remove('hidden');
        formStepsContainer.classList.add('hidden'); // Hide form steps if critical error
        globalLoadingSpinner.classList.add('hidden');
    } else {
        globalErrorMessageContainer.classList.add('hidden');
        if (!isLoading) formStepsContainer.classList.remove('hidden'); // Show form if not loading
    }
}

function clearGlobalError() {
    globalError = null;
    globalErrorMessageContainer.classList.add('hidden');
    // Re-evaluate if form steps should be shown, e.g., after API key error is potentially resolved externally
    if (!isLoading && !isApiKeyMissing) {
        formStepsContainer.classList.remove('hidden');
    }
}


// --- Event Handlers & Logic ---
function handleHealthIssueChange() {
  userData.healthIssue = healthIssueSelect.value;
  if (healthIssueSelect.value === HealthIssue.OTHER) {
    customHealthIssueContainer.classList.remove('hidden');
  } else {
    customHealthIssueContainer.classList.add('hidden');
    customHealthIssueInput.value = '';
    userData.customHealthIssue = '';
  }
  clearInputError(healthIssueError);
}

function handleHealthIssueNext() {
  let isValid = true;
  if (!healthIssueSelect.value) {
    displayInputError(healthIssueError, 'Please select or specify a health issue.');
    isValid = false;
  } else if (healthIssueSelect.value === HealthIssue.OTHER && !customHealthIssueInput.value.trim()) {
    displayInputError(healthIssueError, 'Please specify your health issue.');
    isValid = false;
  }

  if (isValid) {
    clearInputError(healthIssueError);
    userData.healthIssue = healthIssueSelect.value;
    if (userData.healthIssue === HealthIssue.OTHER) {
      userData.customHealthIssue = customHealthIssueInput.value.trim();
    } else {
      userData.customHealthIssue = '';
    }
    currentStep = FormStep.PERSONAL_DATA;
    showStep(currentStep);
  }
}

function validatePersonalData() {
  let isValid = true;
  const ageVal = parseInt(ageInput.value);
  if (isNaN(ageVal) || ageVal <= 0 || ageVal > 120) {
    displayInputError(ageError, 'Please enter a valid age.'); isValid = false;
  } else { clearInputError(ageError); }

  if (!genderSelect.value) { displayInputError(genderError, 'Please select your gender.'); isValid = false; } 
  else { clearInputError(genderError); }
  
  if (!severitySelect.value) { displayInputError(severityError, 'Please select the severity.'); isValid = false; }
  else { clearInputError(severityError); }

  if (!activityLevelSelect.value) { displayInputError(activityLevelError, 'Please select your activity level.'); isValid = false; }
  else { clearInputError(activityLevelError); }

  if (!smokerSelect.value) { displayInputError(smokerError, 'Please specify if you are a smoker.'); isValid = false; }
  else { clearInputError(smokerError); }
  
  return isValid;
}

function handlePersonalDataNext() {
  if (validatePersonalData()) {
    userData.age = parseInt(ageInput.value);
    userData.gender = genderSelect.value;
    userData.severity = severitySelect.value;
    userData.activityLevel = activityLevelSelect.value;
    userData.smoker = smokerSelect.value;
    userData.medication = medicationInput.value.trim();
    currentStep = FormStep.LOCATION;
    showStep(currentStep);
  }
}

function handlePersonalDataPrev() {
  currentStep = FormStep.HEALTH_ISSUE;
  showStep(currentStep);
}

function updateLocationDisplay() {
    if (userData.location) {
        locationAcquiredMessage.innerHTML = `Location acquired: Latitude ${userData.location.latitude.toFixed(4)}, Longitude ${userData.location.longitude.toFixed(4)}. <button id="clear-location-btn-inner" class="ml-2 text-xs text-sky-600 hover:text-sky-800 font-medium">Clear</button>`;
        locationAcquiredMessage.classList.remove('hidden');
        manualLocationInput.disabled = true;
        manualLocationInput.value = ''; // Clear manual input
        userData.manualLocationInput = '';
        document.getElementById('clear-location-btn-inner').addEventListener('click', () => {
            userData.location = null;
            manualLocationInput.disabled = false;
            locationAcquiredMessage.classList.add('hidden');
            clearInputError(locationError);
        });
    } else {
        locationAcquiredMessage.classList.add('hidden');
        manualLocationInput.disabled = false;
    }
    geoLocationBtn.disabled = !!userData.location || isFetchingGeo;
}

function handleGeoLocation() {
  if (!navigator.geolocation) {
    displayInputError(locationError, "Geolocation is not supported by your browser.");
    return;
  }
  isFetchingGeo = true;
  geoLocationBtnIconContainer.innerHTML = getLoadingSpinnerSVG('sm', 'white');
  geoLocationBtn.disabled = true;
  clearInputError(locationError);

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userData.location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      userData.manualLocationInput = ''; // Clear manual input
      isFetchingGeo = false;
      geoLocationBtnIconContainer.innerHTML = getMapPinIconSVG('h-5 w-5');
      updateLocationDisplay();
    },
    (error) => {
      displayInputError(locationError, `Error getting location: ${error.message}. Please enter manually.`);
      isFetchingGeo = false;
      geoLocationBtnIconContainer.innerHTML = getMapPinIconSVG('h-5 w-5');
      updateLocationDisplay();
    }
  );
}

function handleLocationPrev() {
  currentStep = FormStep.PERSONAL_DATA;
  showStep(currentStep);
}

async function handleLocationSubmit() {
  if (!userData.location && !manualLocationInput.value.trim()) {
    displayInputError(locationError, "Please provide your location or allow access.");
    return;
  }
  clearInputError(locationError);
  if (!userData.location && manualLocationInput.value.trim()) {
      userData.manualLocationInput = manualLocationInput.value.trim();
  }
  
  // This check is crucial. If API key is missing, don't proceed with API calls.
  if (isApiKeyMissing) {
      displayGlobalError(API_KEY_ERROR_MESSAGE); // Show the error on UI
      currentStep = FormStep.RESULTS; // Navigate to results page to show the error state
      showStep(currentStep); 
      renderResultsPage(); // Render results page will show the global error if set, or API specific error
      return;
  }

  currentStep = FormStep.RESULTS; // Move to results step first to show loading there
  showStep(currentStep); // Show the results step container
  resultsLoadingSpinner.classList.remove('hidden');
  resultsLoadingSpinner.innerHTML = `
      ${getLoadingSpinnerSVG('lg', 'sky-600')}
      <p class="text-sky-700 mt-2">Fetching your personalized guidance...</p>`;
  resultsApiErrorContainer.classList.add('hidden');
  resultsSuccessContainer.classList.add('hidden');
  isLoading = true; 
  locationSubmitBtn.disabled = true;
  locationSubmitBtnText.textContent = 'Generating...';


  apiError = null; 
  generatedAdvice = null;
  doctors = [];

  try {
    generatedAdvice = await generateHealthAdviceService(userData);
    doctors = await findNearbyDoctorsService(userData);
  } catch (err) {
    console.error("Submission error:", err);
    apiError = err.message || "An unexpected error occurred. Please try again.";
  } finally {
    isLoading = false;
    locationSubmitBtn.disabled = false;
    locationSubmitBtnText.textContent = 'Get Advice & Find Doctors';
    resultsLoadingSpinner.classList.add('hidden');
    renderResultsPage();
  }
}

function formatTextWithLineBreaks(text) {
    if (!text) return '';
    let content = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let html = '';
    let inList = false;
    content.forEach(line => {
        if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
            if (!inList) {
                html += '<ul>';
                inList = true;
            }
            html += `<li>${line.substring(line.indexOf(' ') + 1)}</li>`; // Get text after first space
        } else {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            html += `<p>${line}</p>`;
        }
    });
    if (inList) {
        html += '</ul>';
    }
    return html;
}

function renderResultsPage() {
    resultsLoadingSpinner.classList.add('hidden');

    // Prioritize showing API key error if it's the root cause
    if (isApiKeyMissing) {
        resultsApiErrorContainer.innerHTML = `
            <div class="card bg-white shadow-xl rounded-lg p-6">
                <div class="flex items-center mb-4">
                    <span class="mr-3 text-red-600">${getSparklesIconSVG('w-8 h-8')}</span>
                    <h3 class="text-xl font-semibold text-slate-800">Configuration Error</h3>
                </div>
                <p class="text-red-600">${API_KEY_ERROR_MESSAGE}</p>
            </div>`;
        resultsApiErrorContainer.classList.remove('hidden');
        resultsSuccessContainer.classList.add('hidden');
        resultsDisclaimer.classList.add('hidden'); // Also hide disclaimer
        return; // Stop further rendering
    }
    
    if (apiError) {
        resultsApiErrorContainer.innerHTML = `
            <div class="card bg-white shadow-xl rounded-lg p-6">
                <div class="flex items-center mb-4">
                    <span class="mr-3 text-red-600">${getSparklesIconSVG('w-8 h-8')}</span>
                    <h3 class="text-xl font-semibold text-slate-800">Error Generating Guidance</h3>
                </div>
                <p class="text-red-600">${apiError}</p>
                <p class="mt-2 text-slate-600">There was an issue fetching your personalized guidance. This might be due to an API configuration problem or a temporary network issue.</p>
            </div>`;
        resultsApiErrorContainer.classList.remove('hidden');
        resultsSuccessContainer.classList.add('hidden');
    } else if (generatedAdvice) {
        resultsApiErrorContainer.classList.add('hidden');
        resultsSuccessContainer.classList.remove('hidden');
        
        const userHealthIssueDisplay = userData.healthIssue === HealthIssue.OTHER ? userData.customHealthIssue : userData.healthIssue;
        resultsTitle.textContent = "Your Personalized Wellness Plan";
        resultsSubtitle.textContent = `Guidance for managing ${userHealthIssueDisplay}.`;

        dietPlanDiv.innerHTML = formatTextWithLineBreaks(generatedAdvice.dietPlan);
        exerciseRecommendationsDiv.innerHTML = formatTextWithLineBreaks(generatedAdvice.exerciseRecommendations);
        dailyHealthTipsDiv.innerHTML = formatTextWithLineBreaks(generatedAdvice.dailyHealthTips);

        if (doctors.length > 0) {
            doctorsListDiv.innerHTML = doctors.map(doc => `
                <div class="card bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                    <h4 class="text-lg font-semibold text-emerald-800">${doc.name}</h4>
                    <p class="text-sm text-emerald-700 font-medium">${doc.specialty}</p>
                    <p class="text-sm text-slate-600 mt-1">${doc.address}</p>
                    <p class="text-sm text-slate-600 mt-1">Phone: ${doc.phone}</p>
                    <a href="tel:${doc.phone}" class="mt-3 inline-block px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition-colors">Contact</a>
                </div>`).join('');
            noDoctorsMessage.classList.add('hidden');
            doctorsListDiv.classList.remove('hidden');
        } else {
            noDoctorsMessage.classList.remove('hidden');
            doctorsListDiv.classList.add('hidden');
        }
        resultsDisclaimer.classList.remove('hidden');
    } else {
        // Fallback for unexpected state
        resultsApiErrorContainer.innerHTML = `<p>Could not load results. Please check the console for errors or try again.</p>`;
        resultsApiErrorContainer.classList.remove('hidden');
    }
}


function handleStartOver() {
  userData = { ...initialUserData };
  generatedAdvice = null;
  doctors = [];
  currentStep = FormStep.HEALTH_ISSUE;
  apiError = null;
  // globalError is handled by displayGlobalError/clearGlobalError based on isApiKeyMissing
  
  // Clear form fields
  healthIssueSelect.value = '';
  customHealthIssueInput.value = '';
  ageInput.value = '';
  genderSelect.value = '';
  severitySelect.value = '';
  activityLevelSelect.value = '';
  smokerSelect.value = '';
  medicationInput.value = '';
  manualLocationInput.value = '';
  manualLocationInput.disabled = false;
  locationAcquiredMessage.classList.add('hidden');
  
  // Clear input errors
  [healthIssueError, ageError, genderError, severityError, activityLevelError, smokerError, locationError].forEach(el => clearInputError(el));
  
  // Re-check API key status. This will set isApiKeyMissing.
  checkApiKey(); 
  
  if (isApiKeyMissing) {
      displayGlobalError(API_KEY_ERROR_MESSAGE); // This hides formStepsContainer
      if (stepIndicatorContainer) stepIndicatorContainer.classList.add('hidden');
      // Ensure results page specific containers are hidden too
      if (resultsApiErrorContainer) resultsApiErrorContainer.classList.add('hidden');
      if (resultsSuccessContainer) resultsSuccessContainer.classList.add('hidden');

   } else {
      clearGlobalError(); // This shows formStepsContainer if not loading
      if (stepIndicatorContainer) stepIndicatorContainer.classList.remove('hidden');
      showStep(currentStep); // Show first step if API key is fine
  }
}

// --- API Service Functions ---
async function generateHealthAdviceService(userData) {
  if (isApiKeyMissing || !ai) { // Check !ai as well
    throw new Error(API_KEY_ERROR_MESSAGE);
  }

  const healthIssueDisplay = userData.healthIssue === HealthIssue.OTHER 
    ? userData.customHealthIssue 
    : userData.healthIssue;

  const prompt = `
    You are a helpful AI wellness assistant. Based on the following user health profile, provide personalized health guidance.
    User Profile:
    - Health Issue: ${healthIssueDisplay}
    - Age: ${userData.age}
    - Gender: ${userData.gender}
    - Severity of Issue: ${userData.severity}
    - Activity Level: ${userData.activityLevel}
    - Smoker: ${userData.smoker}
    - Current Medication: ${userData.medication || "None specified"}

    Please respond ONLY with a JSON object with the following structure:
    {
      "dietPlan": "A detailed diet plan. Use paragraphs and bullet points (e.g., using '-' or '*') for clarity. Include specific food suggestions, foods to avoid, and meal timing if relevant. Make it actionable and easy to follow.",
      "exerciseRecommendations": "Specific exercise recommendations. Include types of exercise (e.g., cardio, strength training, yoga), duration, frequency, and intensity. Tailor it to the health issue and user profile. Mention any precautions if necessary. Use paragraphs and bullet points.",
      "dailyHealthTips": "A few general health tips and one motivational message. These should be practical and encouraging. Use paragraphs and bullet points."
    }
    Ensure the response is pure JSON. Do not add any text or markdown formatting outside the JSON structure.
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: [{ role: "user", parts: [{text: prompt}] }],
      config: { responseMimeType: "application/json", temperature: 0.7 },
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    return JSON.parse(jsonStr);

  } catch (error) {
    console.error("Error generating health advice from Gemini:", error);
    let errorMessage = "Failed to generate health advice. The AI service might be temporarily unavailable or encountered an issue with the request.";
    if (error instanceof Error && error.message.includes("API key not valid")) {
        errorMessage = "The configured API Key for Gemini is invalid. Please check your environment configuration.";
        isApiKeyMissing = true; // Potentially update global state if API reports invalid key
        checkApiKey(); // Re-validate, might lead to UI update
    } else if (error instanceof Error && error.message.includes("candidate.finishReason")) {
        errorMessage = "The AI model's response was blocked or incomplete. This could be due to safety settings or an issue with the prompt. Please try rephrasing your inputs or try again later.";
    } else if (error instanceof Error) {
        errorMessage = `An error occurred: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
}

async function findNearbyDoctorsService(userData) {
  // Mock function, simulate delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const userIssue = userData.healthIssue === HealthIssue.OTHER 
    ? userData.customHealthIssue?.toLowerCase() 
    : userData.healthIssue.toLowerCase();
  
  let filteredDoctors = MOCK_DOCTORS.filter(doctor => {
    return doctor.relevantIssues.some(issue => issue.toLowerCase() === userIssue) ||
           (userIssue === HealthIssue.OTHER.toLowerCase() && doctor.specialty.toLowerCase().includes('general'));
  });

  if (userData.manualLocationInput && userData.manualLocationInput.trim() !== "") {
    const manualLocationLower = userData.manualLocationInput.toLowerCase();
    filteredDoctors = filteredDoctors.filter(doctor => 
      doctor.address.toLowerCase().includes(manualLocationLower)
    );
  }
  return filteredDoctors;
}

function checkApiKey() {
    let apiKeyFromEnv = null;
    try {
        // Strict check for process.env.API_KEY as a non-empty string
        if (typeof process !== 'undefined' && 
            process.env && 
            typeof process.env.API_KEY === 'string' && 
            process.env.API_KEY.trim() !== '') {
            apiKeyFromEnv = process.env.API_KEY.trim();
        }
    } catch (e) {
        console.warn("Could not access process.env.API_KEY. This might be normal in some browser environments if not explicitly set.", e);
        apiKeyFromEnv = null;
    }

    if (!apiKeyFromEnv) {
        if (!isApiKeyMissing) { // Log console error only if status changes to missing
            console.error(API_KEY_ERROR_MESSAGE);
        }
        isApiKeyMissing = true;
        ai = null; // Ensure AI client is null if key is missing
    } else {
        // If key was previously missing but now found, or if ai client needs init
        if (isApiKeyMissing || !ai) {
            try {
                ai = new GoogleGenAI({ apiKey: apiKeyFromEnv });
                isApiKeyMissing = false; // Key is found and AI initialized
                // console.log("GoogleGenAI client initialized successfully."); // Optional: for debugging
            } catch (initError) {
                console.error("Error initializing GoogleGenAI:", initError);
                console.error(API_KEY_ERROR_MESSAGE + " (Initialization failed)");
                isApiKeyMissing = true; // Treat init error as API key issue
                ai = null;
            }
        } else {
             isApiKeyMissing = false; // Key is present and AI was already initialized
        }
    }
}


// --- Initialization ---
function initApp() {
  // Get all DOM elements
  healthIssueSelect = document.getElementById('healthIssue');
  customHealthIssueContainer = document.getElementById('custom-health-issue-container');
  customHealthIssueInput = document.getElementById('customHealthIssue');
  healthIssueError = document.getElementById('health-issue-error');
  healthIssueNextBtn = document.getElementById('healthIssueNextBtn');

  ageInput = document.getElementById('age');
  genderSelect = document.getElementById('gender');
  severitySelect = document.getElementById('severity');
  activityLevelSelect = document.getElementById('activityLevel');
  smokerSelect = document.getElementById('smoker');
  medicationInput = document.getElementById('medication');
  ageError = document.getElementById('age-error');
  genderError = document.getElementById('gender-error');
  severityError = document.getElementById('severity-error');
  activityLevelError = document.getElementById('activityLevel-error');
  smokerError = document.getElementById('smoker-error');
  personalDataPrevBtn = document.getElementById('personalDataPrevBtn');
  personalDataNextBtn = document.getElementById('personalDataNextBtn');

  locationAcquiredMessage = document.getElementById('location-acquired-message');
  clearLocationBtn = document.getElementById('clear-location-btn'); 
  locationError = document.getElementById('location-error');
  geoLocationBtn = document.getElementById('geoLocationBtn');
  manualLocationInput = document.getElementById('manualLocation');
  locationPrevBtn = document.getElementById('locationPrevBtn');
  locationSubmitBtn = document.getElementById('locationSubmitBtn');
  locationSubmitBtnText = document.getElementById('locationSubmitBtnText');
  geoLocationBtnIconContainer = document.getElementById('geoLocationBtnIconContainer');

  stepHealthIssue = document.getElementById('step-health-issue');
  stepPersonalData = document.getElementById('step-personal-data');
  stepLocation = document.getElementById('step-location');
  stepResults = document.getElementById('step-results');
  
  resultsLoadingSpinner = document.getElementById('results-loading-spinner');
  resultsApiErrorContainer = document.getElementById('results-api-error-container');
  resultsSuccessContainer = document.getElementById('results-success-container');
  resultsTitle = document.getElementById('results-title');
  resultsSubtitle = document.getElementById('results-subtitle');
  dietPlanDiv = document.getElementById('dietPlan');
  exerciseRecommendationsDiv = document.getElementById('exerciseRecommendations');
  dailyHealthTipsDiv = document.getElementById('dailyHealthTips');
  doctorsListDiv = document.getElementById('doctorsList');
  noDoctorsMessage = document.getElementById('noDoctorsMessage');
  resultsDisclaimer = document.getElementById('results-disclaimer');
  startOverBtn = document.getElementById('startOverBtn');

  stepIndicatorContainer = document.getElementById('step-indicator-container');
  globalLoadingSpinner = document.getElementById('global-loading-spinner');
  globalErrorMessageContainer = document.getElementById('global-error-message-container');
  formStepsContainer = document.getElementById('form-steps-container');
  
  headerIconContainer = document.getElementById('header-icon-container');
  dietPlanIcon = document.getElementById('diet-plan-icon');
  exerciseIcon = document.getElementById('exercise-icon');
  healthTipsIcon = document.getElementById('health-tips-icon');
  doctorsListIcon = document.getElementById('doctors-list-icon');

  healthIssueNextIcon = document.getElementById('healthIssueNextIcon');
  personalDataPrevIcon = document.getElementById('personalDataPrevIcon');
  personalDataNextIcon = document.getElementById('personalDataNextIcon');
  locationPrevIcon = document.getElementById('locationPrevIcon');


  // Inject static icons
  headerIconContainer.innerHTML = getHeartIconSVG('h-10 w-10 text-sky-600 mr-3');
  dietPlanIcon.innerHTML = getSparklesIconSVG('w-6 h-6'); 
  exerciseIcon.innerHTML = getSparklesIconSVG('w-6 h-6');
  healthTipsIcon.innerHTML = getSparklesIconSVG('w-6 h-6');
  doctorsListIcon.innerHTML = getMapPinIconSVG('w-6 h-6'); 
  healthIssueNextIcon.innerHTML = getChevronRightIconSVG();
  personalDataPrevIcon.innerHTML = getChevronLeftIconSVG();
  personalDataNextIcon.innerHTML = getChevronRightIconSVG();
  locationPrevIcon.innerHTML = getChevronLeftIconSVG();
  geoLocationBtnIconContainer.innerHTML = getMapPinIconSVG('h-5 w-5');


  // Populate selects
  populateSelect(healthIssueSelect, HEALTH_ISSUES_OPTIONS, true, '-- Select an issue --');
  populateSelect(genderSelect, GENDER_OPTIONS);
  populateSelect(severitySelect, SEVERITY_OPTIONS);
  populateSelect(activityLevelSelect, ACTIVITY_LEVEL_OPTIONS);
  populateSelect(smokerSelect, SMOKER_OPTIONS);

  // Attach event listeners
  healthIssueSelect.addEventListener('change', handleHealthIssueChange);
  healthIssueNextBtn.addEventListener('click', handleHealthIssueNext);
  
  personalDataPrevBtn.addEventListener('click', handlePersonalDataPrev);
  personalDataNextBtn.addEventListener('click', handlePersonalDataNext);

  geoLocationBtn.addEventListener('click', handleGeoLocation);
  if (clearLocationBtn) { 
      clearLocationBtn.addEventListener('click', () => {
        userData.location = null;
        manualLocationInput.disabled = false;
        manualLocationInput.value = ''; 
        userData.manualLocationInput = '';
        locationAcquiredMessage.classList.add('hidden');
        clearInputError(locationError);
        updateLocationDisplay(); 
    });
  }

  manualLocationInput.addEventListener('input', () => { 
      if (manualLocationInput.value.trim() !== "" && userData.location) {
          userData.location = null; 
      }
      userData.manualLocationInput = manualLocationInput.value;
      if (locationError.textContent) clearInputError(locationError);
  });
  locationPrevBtn.addEventListener('click', handleLocationPrev);
  locationSubmitBtn.addEventListener('click', handleLocationSubmit);
  
  startOverBtn.addEventListener('click', handleStartOver);
  
  document.getElementById('currentYear').textContent = new Date().getFullYear();

  checkApiKey(); 
  
  if (isApiKeyMissing) {
      displayGlobalError(API_KEY_ERROR_MESSAGE); // This will hide formStepsContainer
      if (stepIndicatorContainer) stepIndicatorContainer.classList.add('hidden');
  } else {
      clearGlobalError(); // Ensure no previous global error is showing
      if (stepIndicatorContainer) stepIndicatorContainer.classList.remove('hidden');
      showStep(currentStep); // Show the initial step
  }
}

document.addEventListener('DOMContentLoaded', initApp);
