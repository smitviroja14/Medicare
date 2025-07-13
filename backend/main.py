# 🔹 Enhanced MediBot Backend - Merged Version
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
from PIL import Image
import google.generativeai as genai
import requests
import base64
import io
import logging
import re
import os
from datetime import datetime
import asyncio
import json
from dotenv import load_dotenv


load_dotenv()
# 🔹 Optional: Ngrok setup
try:
    import nest_asyncio
    from pyngrok import conf, ngrok
    nest_asyncio.apply()
    NGROK_AVAILABLE = True
except ImportError:
    NGROK_AVAILABLE = False

# 🔹 Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 🔹 FastAPI app
app = FastAPI(
    title="MediBot API", 
    version="2.0",
    description="Advanced Medical Information Assistant API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/get-ngrok-url")
def get_ngrok_url():
    if os.path.exists("api_url.json"):
        with open("api_url.json", "r") as f:
            data = json.load(f)
            return {"url": data.get("url")}
    return {"url": None}

# 🔹 Configuration
GOOGLE_API_KEY=os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

# 🔹 Enhanced Pydantic models
class ChatMessage(BaseModel):
    message: str
    image_data: Optional[str] = None

class MedicationInfo(BaseModel):
    name: str
    purpose: Optional[str] = None
    warnings: Optional[str] = None
    dosage: Optional[str] = None
    interactions: Optional[List[str]] = None
    side_effects: Optional[List[str]] = None

class HealthCheck(BaseModel):
    status: str
    timestamp: str
    google_ai_configured: bool
    version: str

class ChatResponse(BaseModel):
    response: str
    medication_info: Optional[MedicationInfo] = None
    confidence: float
    timestamp: str
    sources: Optional[List[str]] = None

# 🔹 Enhanced medical knowledge base
MEDICAL_KNOWLEDGE = {
    "headache": {
        "causes": ["tension", "dehydration", "stress", "eye strain", "migraines", "sinus pressure"],
        "otc_treatments": ["acetaminophen", "ibuprofen", "aspirin", "naproxen"],
        "home_remedies": ["rest", "hydration", "cold compress", "dark room", "gentle massage"],
        "red_flags": ["sudden severe headache", "headache with fever", "vision changes", "neck stiffness"]
    },
    "fever": {
        "causes": ["infection", "inflammation", "heat exhaustion", "medication side effects"],
        "otc_treatments": ["acetaminophen", "ibuprofen", "aspirin"],
        "home_remedies": ["rest", "fluids", "cool compress", "light clothing"],
        "red_flags": ["fever above 103°F", "difficulty breathing", "severe headache", "rash"]
    },
    "cough": {
        "causes": ["cold", "flu", "allergies", "acid reflux", "smoking"],
        "otc_treatments": ["dextromethorphan", "guaifenesin", "honey"],
        "home_remedies": ["honey", "warm liquids", "humidifier", "throat lozenges"],
        "red_flags": ["coughing up blood", "difficulty breathing", "chest pain", "prolonged fever"]
    },
    "nausea": {
        "causes": ["food poisoning", "motion sickness", "pregnancy", "medication side effects"],
        "otc_treatments": ["bismuth subsalicylate", "meclizine", "dimenhydrinate"],
        "home_remedies": ["ginger", "small sips of water", "bland foods", "rest"],
        "red_flags": ["severe dehydration", "blood in vomit", "severe abdominal pain", "signs of appendicitis"]
    }
}

DRUG_INTERACTIONS = {
    "warfarin": ["aspirin", "ibuprofen", "naproxen"],
    "aspirin": ["warfarin", "ibuprofen", "naproxen"],
    "ibuprofen": ["warfarin", "aspirin", "naproxen"],
    "naproxen": ["warfarin", "aspirin", "ibuprofen"]
}

# 🔹 Enhanced Medical Chatbot
class MedicalChatbot:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        self.conversation_history = []

    async def analyze_image(self, image_data: str, user_message: str = "") -> Dict:
        """Enhanced image analysis with better error handling"""
        try:
            # Decode base64 image
            if ',' in image_data:
                image_bytes = base64.b64decode(image_data.split(',')[1])
            else:
                image_bytes = base64.b64decode(image_data)
            
            image = Image.open(io.BytesIO(image_bytes))
            
            # Enhanced prompt for better analysis
            prompt = f"""
           You are a trusted AI medical assistant trained to provide detailed, patient-friendly information about medications. 

The user may provide either:
- A medication image
- A text-based question
- Or both

Analyze the input and respond using the following format:

---

**💊 MEDICATION OVERVIEW**
- Name: [Brand and/or Generic Name]
- Dosage: [Strength and Form]
- Active Ingredient(s): [Chemical composition]

**📘 MEDICAL INFORMATION**
- Purpose: [What it treats]
- How to Take: [Administration instructions]
- Common Side Effects: [3–5 expected side effects]
- Warnings: [Important safety notes, allergies, misuse]

**⚠️ SAFETY & INTERACTIONS**
- Drug Interactions: [Major medications or substances to avoid]
- When to Contact a Doctor: [Red flag symptoms or emergencies]

---

User’s specific question or concern: "{user_message or 'Please identify and describe this medication'}"

If an image is provided, describe its likely contents. If only a message is provided, analyze the query accordingly. Always prioritize clarity and patient safety..
            """
            
            response = self.model.generate_content([prompt, image])
            
            # Extract structured information
            medication_info = self.extract_medication_info(response.text)
            
            return {
                "response": response.text,
                "medication_info": medication_info,
                "confidence": 0.9,
                "sources": ["Google Gemini AI Image Analysis"]
            }
            
        except Exception as e:
            logger.error(f"Image analysis error: {str(e)}")
            return {
                "response": f"❌ I couldn't analyze the image. Please ensure it's a clear photo of medication packaging. Error: {str(e)}",
                "medication_info": None,
                "confidence": 0.0,
                "sources": []
            }

    def extract_medication_info(self, text: str) -> Optional[MedicationInfo]:
        """Extract structured medication information from AI response"""
        try:
            # Simple extraction - can be enhanced with NLP
            name_match = re.search(r'Name:\s*([^\n]+)', text, re.IGNORECASE)
            purpose_match = re.search(r'Purpose:\s*([^\n]+)', text, re.IGNORECASE)
            dosage_match = re.search(r'Dosage:\s*([^\n]+)', text, re.IGNORECASE)
            warnings_match = re.search(r'Warnings:\s*([^\n]+)', text, re.IGNORECASE)
            
            if name_match:
                return MedicationInfo(
                    name=name_match.group(1).strip(),
                    purpose=purpose_match.group(1).strip() if purpose_match else None,
                    dosage=dosage_match.group(1).strip() if dosage_match else None,
                    warnings=warnings_match.group(1).strip() if warnings_match else None
                )
        except Exception as e:
            logger.error(f"Medication info extraction error: {str(e)}")
        
        return None

    def extract_drug_name(self, text: str) -> Optional[str]:
        """Extract drug name from text"""
        # Enhanced pattern matching
        patterns = [
            r'\b([A-Z][a-z]{3,})\s*\d+\s*mg\b',  # Drugname 500mg
            r'\b([A-Z][a-z]{3,})\s*\d+\s*mcg\b',  # Drugname 100mcg
            r'\b([A-Z][a-z]{3,})\s*tablet\b',      # Drugname tablet
            r'\b([A-Z][a-z]{3,})\s*capsule\b'      # Drugname capsule
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                return matches[0].lower()
        return None

    async def get_fda_info(self, drug_name: str) -> Optional[MedicationInfo]:
        """Enhanced FDA API integration with better error handling"""
        try:
            url = "https://api.fda.gov/drug/label.json"
            params = {
                'search': f'openfda.brand_name:"{drug_name}" OR openfda.generic_name:"{drug_name}"',
                'limit': 1
            }
            
            response = requests.get(url, params=params, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('results'):
                    result = data['results'][0]
                    return MedicationInfo(
                        name=drug_name,
                        purpose=result.get('purpose', [None])[0],
                        warnings=result.get('warnings', [None])[0],
                        dosage=result.get('dosage_and_administration', [None])[0],
                        interactions=result.get('drug_interactions', [])[:5],
                        side_effects=result.get('adverse_reactions', [])[:5]
                    )
            else:
                logger.warning(f"FDA API returned status {response.status_code}")
                
        except Exception as e:
            logger.error(f"FDA API Error: {str(e)}")
        
        return None

    def generate_medical_response(self, message: str) -> Dict:
        """Enhanced medical response generation"""
        message_lower = message.lower()
        
        # Check for symptoms in knowledge base
        for symptom, info in MEDICAL_KNOWLEDGE.items():
            if symptom in message_lower:
                response = f"""
**{symptom.title()} Information**

🔍 **Common Causes:**
{self.format_list(info['causes'])}

💊 **Over-the-Counter Options:**
{self.format_list(info['otc_treatments'])}

🏠 **Home Remedies:**
{self.format_list(info['home_remedies'])}

🚨 **Seek Medical Attention If:**
{self.format_list(info['red_flags'])}

**Remember:** This is general information only. Individual cases may vary.
"""
                return {
                    "response": response,
                    "confidence": 0.85,
                    "sources": ["MediBot Knowledge Base"]
                }
        
        # Check for drug interactions
        for drug, interactions in DRUG_INTERACTIONS.items():
            if drug in message_lower:
                response = f"""
**{drug.title()} - Drug Interaction Warning**

⚠️ **May interact with:**
{self.format_list(interactions)}

**Important:** Always inform your healthcare provider about all medications you're taking, including over-the-counter drugs and supplements.
"""
                return {
                    "response": response,
                    "confidence": 0.9,
                    "sources": ["Drug Interaction Database"]
                }
        
        # General response for unmatched queries
        response = f"""
🤖 **I received your query:** "{message}"

I can help you with:
- 📷 **Image Analysis** - Upload photos of medication packaging
- 💊 **Drug Information** - Details about medications and interactions
- 🩺 **Symptom Guidance** - Information about common health concerns
- ⚕️ **OTC Recommendations** - Over-the-counter treatment options

Please provide more specific information or upload an image for better assistance.
"""
        return {
            "response": response,
            "confidence": 0.6,
            "sources": ["MediBot General Response"]
        }

    def format_list(self, items: List[str]) -> str:
        """Format list items with bullet points"""
        return "\n".join([f"• {item.title()}" for item in items])

    def add_disclaimer(self, text: str) -> str:
        """Add medical disclaimer to response"""
        return text + "\n\n⚠️ **MEDICAL DISCLAIMER:** This information is for educational purposes only and should not replace professional medical advice. Always consult with a qualified healthcare provider for diagnosis and treatment."

# 🔹 Initialize chatbot
chatbot = MedicalChatbot()

# 🔹 API Routes
@app.get("/", response_model=Dict)
async def root():
    return {
        "message": "MediBot API v2.0 is live",
        "version": "2.0",
        "endpoints": ["/chat", "/health", "/docs"]
    }

@app.get("/health", response_model=HealthCheck)
async def health_check():
    """Enhanced health check endpoint"""
    return HealthCheck(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        google_ai_configured=bool(GOOGLE_API_KEY),
        version="2.0"
    )

@app.post("/chat", response_model=ChatResponse)
async def chat(message: ChatMessage):
    """Enhanced chat endpoint with better error handling"""
    try:
        response_data = {
            "response": "",
            "medication_info": None,
            "confidence": 0.0,
            "timestamp": datetime.now().isoformat(),
            "sources": []
        }

        # Handle image analysis
        if message.image_data:
            result = await chatbot.analyze_image(message.image_data, message.message)
            response_data.update(result)
            
            # Try to get FDA info if drug name is extracted
            if result.get("medication_info"):
                drug_name = result["medication_info"].name
                fda_info = await chatbot.get_fda_info(drug_name)
                if fda_info:
                    response_data["medication_info"] = fda_info
                    response_data["sources"].append("FDA Database")

        # Handle text-only queries
        elif message.message:
            result = chatbot.generate_medical_response(message.message)
            response_data.update(result)
            
            # Try to get FDA info if drug name is mentioned
            drug_name = chatbot.extract_drug_name(message.message)
            if drug_name:
                fda_info = await chatbot.get_fda_info(drug_name)
                if fda_info:
                    response_data["medication_info"] = fda_info
                    response_data["sources"].append("FDA Database")

        # Add disclaimer to response
        response_data["response"] = chatbot.add_disclaimer(response_data["response"])

        return ChatResponse(**response_data)

    except Exception as e:
        logger.error(f"Chat endpoint error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


# 🔹 Run App + Auto Ngrok
if __name__ == "__main__":
    try:
        if NGROK_AVAILABLE:
            conf.get_default().auth_token=os.getenv("auth_token")
            public_url = ngrok.connect(8000)
            print(f"🚀 MediBot is live at: {public_url}")
            print(f"📚 API Docs: {public_url}/docs")
            with open("api_url.json", "w") as f:
                json.dump({"url": str(public_url)}, f)
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=8000)
    except Exception as e:
        logger.error(f"Ngrok/launch error: {str(e)}")




# 🔹 Optional: Google Colab deployment
# if COLAB_MODE and __name__ == "__main__":
#     try:
#         # Configure ngrok (replace with your token)
#         conf.get_default().auth_token = "2zo8bhINJNSlfwQAnJLYkdtOHRy_4N37uZEY2bsLsX2KkqZtW"
        
#         # Create tunnel
#         public_url = ngrok.connect(8000)
#         print(f"🚀 MediBot v2.0 running at: {public_url}")
#         print(f"📚 API Documentation: {public_url}/docs")
        
#         # Start server
#         import uvicorn
#         uvicorn.run(app, host="0.0.0.0", port=8000)
        
#     except Exception as e:
#         logger.error(f"Colab deployment error: {str(e)}")
#         print("⚠️  Colab deployment failed. Running in standard mode.")

# 🔹 Standard deployment
# if __name__ == "__main__" and not COLAB_MODE:
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)



