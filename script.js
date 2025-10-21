import { GoogleGenAI } from "@google/genai";

/* -------------------------------
   🌿 HEALTH GUIDANCE SYSTEM LOGIC
---------------------------------*/

// --- Constants ---
const HealthIssues = Object.freeze({
  DIABETES: "Diabetes",
  BLOOD_PRESSURE: "High Blood Pressure",
  HEART_DISEASE: "Heart Disease",
  ASTHMA: "Asthma",
  OBESITY: "Obesity",
  THYROID: "Thyroid Disorder",
  OTHER: "Other",
});

const HEALTH_ISSUE_OPTIONS = Object.values(HealthIssues);

const MOCK_DOCTORS = [
  { id: "1", name: "Dr. Emily Carter", specialty: "Endocrinologist", address: "123 Health St, Wellness City, CA", phone: "555-0101", relevantIssues: [HealthIssues.DIABETES, HealthIssues.THYROID, HealthIssues.OBESITY], lat: 34.0522, lon: -118.2437 },
  { id: "2", name: "Dr. Johnathan Lee", specialty: "Cardiologist", address: "456 Heartbeat Ave, Vitality Town, TX", phone: "555-0102", relevantIssues: [HealthIssues.HEART_DISEASE, HealthIssues.BLOOD_PRESSURE, HealthIssues.OBESITY], lat: 29.7604, lon: -95.3698 },
  { id: "3", name: "Dr. Sarah Miller", specialty: "Pulmonologist", address: "789 Breath Easy Rd, Airy Village, FL", phone: "555-0103", relevantIssues: [HealthIssues.ASTHMA], lat: 28.5383, lon: -81.3792 },
  { id: "4", name: "Dr. Ben Green", specialty: "General Practitioner", address: "101 Wellbeing Ln, Serene Suburb, NY", phone: "555-0104", relevantIssues: [HealthIssues.DIABETES, HealthIssues.BLOOD_PRESSURE, HealthIssues.OBESITY], lat: 40.7128, lon: -74.0060 },
  { id: "5", name: "Dr. Olivia Chen", specialty: "Nutritionist & Wellness Coach", address: "220 Healthy Way, Fit City, CA", phone: "555-0105", relevantIssues: [HealthIssues.OBESITY, HealthIssues.DIABETES], lat: 34.0522, lon: -118.2437 },
];

const GENDER_OPTIONS = ["Male", "Female", "Other"];
const SEVERITY_OPTIONS = ["Mild", "Moderate", "Severe"];
const ACTIVITY_LEVEL_OPTIONS = ["Sedentary", "Lightly Active", "Moderately Active", "Very Active"];
const SMOKER_OPTIONS = ["Yes", "No"];
const API_KEY_ERROR = "⚠️ Gemini API key missing! Please configure the environment variable.";

const FormStep = Object.freeze({
  HEALTH_ISSUE: 1,
  PERSONAL_DATA: 2,
  LOCATION: 3,
  RESULTS: 4,
});

const STEPS = [
  { id: FormStep.HEALTH_ISSUE, label: "Health Issue" },
  { id: FormStep.PERSONAL_DATA, label: "Personal Info" },
  { id: FormStep.LOCATION, label: "Location" },
  { id: FormStep.RESULTS, label: "Guidance" },
];

// --- State Management ---
let currentStep = FormStep.HEALTH_ISSUE;
let userData = {
  healthIssue: "",
  customIssue: "",
  age: "",
  gender: "",
  severity: "",
  activityLevel: "",
  smoker: "",
  medication: "",
  location: null,
};
let generatedAdvice = null;
let isApiKeyMissing = false;

// --- Initialize Gemini AI ---
let ai;
const GEMINI_MODEL = "gemini-2.5-flash-preview-04-17";

async function initGemini() {
  try {
    ai = new GoogleGenAI(process.env.API_KEY);
  } catch {
    isApiKeyMissing = true;
    console.error(API_KEY_ERROR);
  }
}

/* -------------------------------
   ⚙️ STEP HANDLERS
---------------------------------*/

function nextStep() {
  if (currentStep < FormStep.RESULTS) {
    currentStep++;
    renderStep();
  }
}

function prevStep() {
  if (currentStep > FormStep.HEALTH_ISSUE) {
    currentStep--;
    renderStep();
  }
}

function renderStep() {
  document.querySelectorAll(".step-section").forEach((el) => el.classList.add("hidden"));
  document.querySelector(`#step-${currentStep}`).classList.remove("hidden");
}

/* -------------------------------
   📍 LOCATION HANDLING
---------------------------------*/

async function getUserLocation() {
  if (!navigator.geolocation) return alert("Geolocation not supported.");

  try {
    return await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => reject(err)
      );
    });
  } catch (err) {
    alert(`Error: ${err.message}`);
    return null;
  }
}

/* -------------------------------
   🧠 GEMINI HEALTH ADVICE
---------------------------------*/

async function getHealthAdvice(userData) {
  if (!ai) throw new Error(API_KEY_ERROR);

  const prompt = `
You are a medical wellness assistant.
Provide advice for:
Health Issue: ${userData.healthIssue}
Severity: ${userData.severity}
Age: ${userData.age}
Activity: ${userData.activityLevel}
Smoker: ${userData.smoker}
Medications: ${userData.medication}

Give:
1. Diet plan
2. Exercise advice
3. 3 daily health tips
  `;

  const response = await ai.generateText({
    model: GEMINI_MODEL,
    prompt,
  });

  return response.output_text;
}

/* -------------------------------
   🩺 FIND NEARBY DOCTORS
---------------------------------*/

function findDoctors(issue) {
  return MOCK_DOCTORS.filter((doc) => doc.relevantIssues.includes(issue));
}

/* -------------------------------
   🎨 UI UPDATES
---------------------------------*/

async function handleSubmit() {
  if (isApiKeyMissing) {
    alert(API_KEY_ERROR);
    return;
  }

  const adviceContainer = document.getElementById("results");
  adviceContainer.innerHTML = "Loading...";

  try {
    const advice = await getHealthAdvice(userData);
    const nearbyDoctors = findDoctors(userData.healthIssue);

    adviceContainer.innerHTML = `
      <h2>🩺 Personalized Health Guidance</h2>
      <p>${advice}</p>
      <h3>Nearby Doctors</h3>
      <ul>${nearbyDoctors.map((d) => `<li>${d.name} - ${d.specialty}</li>`).join("")}</ul>
    `;
  } catch (err) {
    adviceContainer.innerHTML = `<p style="color:red;">${err.message}</p>`;
  }
}

/* -------------------------------
   🚀 APP INIT
---------------------------------*/

document.addEventListener("DOMContentLoaded", async () => {
  await initGemini();
  renderStep();

  document.getElementById("next-btn").addEventListener("click", nextStep);
  document.getElementById("prev-btn").addEventListener("click", prevStep);
  document.getElementById("submit-btn").addEventListener("click", handleSubmit);
});

