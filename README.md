# 🏥 Basic Healthcare Website

This is a **basic healthcare website** designed to provide essential health-related information and simple tools to help users stay informed about their well-being.  
The project focuses on building a clean, responsive layout using HTML, CSS, and JavaScript — with integration for AI assistance using **Google Gemini API**.

---

## 🧠 About the Project
The **Healthcare Website** aims to give users quick access to basic healthcare tips, information on common conditions, and a chatbot section (powered by Gemini API) for general health-related queries.

This project is built as a beginner-level web development practice focusing on:
- Basic UI design  
- Simple interactivity with JavaScript  
- API integration for AI responses  

---

## ⚙️ Working of the Website
1. **Homepage:** Displays a simple introduction and health tips.  
2. **Services Section:** Lists basic healthcare categories (e.g., diet, exercise, mental health).  
3. **Chatbot / AI Assistant:** Allows users to ask general healthcare questions.  
   - Uses **Gemini API** for generating helpful responses.  
4. **Contact Section:** Basic contact form for feedback or queries.

---

## 🔑 Gemini API Key Updation (Working)
To make the AI chatbot functional:
1. Go to your **Gemini API dashboard** (Google AI Studio).  
2. Copy your **API key**.  
3. Open the project folder → locate the JavaScript file (e.g., `script.js` or `chatbot.js`).  
4. Find the variable:
   ```javascript
   const GEMINI_API_KEY = "your_api_key_here";
