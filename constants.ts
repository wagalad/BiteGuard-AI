import { BiteInfo } from './types';

export const MODEL_URL = "https://teachablemachine.withgoogle.com/models/kqrcjxnHU/";

// Mapping common model labels to detailed medical info
// Keys are normalized to lowercase for matching
export const BITE_DATABASE: Record<string, BiteInfo> = {
  "mosquito": {
    name: "Mosquito Bite",
    symptoms: ["Red, puffy bump", "Itching", "Localized swelling"],
    treatment: ["Wash with soap and water", "Apply ice pack", "Use anti-itch cream or antihistamine"],
    seekDoctor: ["Signs of infection (pus, warmth)", "Fever", "Severe headache or body aches"],
    severity: "low"
  },
  "tick": {
    name: "Tick Bite",
    symptoms: ["Small red bump", "Tick may still be attached", "Red 'bullseye' rash (Lyme disease warning)"],
    treatment: ["Remove tick carefully with tweezers", "Clean area with alcohol", "Save tick for testing if possible"],
    seekDoctor: ["Bullseye rash appears", "Flu-like symptoms", "Joint pain"],
    severity: "medium"
  },
  "spider": {
    name: "Spider Bite",
    symptoms: ["Redness", "Swelling", "Pain at site", "Two puncture marks (sometimes)"],
    treatment: ["Clean with soap and water", "Apply cool compress", "Elevate the area"],
    seekDoctor: ["Severe pain or cramping", "Difficulty breathing", "Ulceration (open sore) at site"],
    severity: "medium"
  },
  "bed bug": {
    name: "Bed Bug Bite",
    symptoms: ["Itchy red welts in a line or zigzag", "Small red bumps", "Blisters"],
    treatment: ["Wash with soap and water", "Apply corticosteroid cream", "Take oral antihistamine"],
    seekDoctor: ["Signs of allergic reaction", "Severe infection from scratching"],
    severity: "low"
  },
  "bee": {
    name: "Bee/Wasp Sting",
    symptoms: ["Sharp pain", "Redness", "Swelling", "Warmth"],
    treatment: ["Remove stinger (scrape, don't pinch)", "Wash area", "Ice pack"],
    seekDoctor: ["Swelling of face/throat", "Difficulty breathing (Anaphylaxis)", "Dizziness"],
    severity: "medium"
  },
  "ant": {
    name: "Ant Bite (Fire Ant)",
    symptoms: ["Red spots", "Pustules (bumps with white fluid)", "Burning sensation", "Itching"],
    treatment: ["Wash area", "Cold compress", "Antihistamine for itching"],
    seekDoctor: ["Signs of allergic reaction", "Spreading redness", "Severe swelling"],
    severity: "low"
  },
  "flea": {
    name: "Flea Bite",
    symptoms: ["Small red bumps often in clusters", "Usually on ankles/legs", "Intense itching", "Red halo around bite"],
    treatment: ["Do not scratch", "Wash with antiseptic soap", "Apply ice or anti-itch cream"],
    seekDoctor: ["Signs of infection", "Tapeworm symptoms (rare)"],
    severity: "low"
  },
  "snake": {
    name: "Snake Bite",
    symptoms: ["Two puncture wounds", "Severe pain", "Rapid swelling", "Nausea", "Labored breathing"],
    treatment: ["Keep calm and still", "Remove jewelry/tight clothing", "Keep bite below heart level"],
    seekDoctor: ["IMMEDIATELY call emergency services", "Do not cut or suck the wound"],
    severity: "high"
  },
  "unknown": {
    name: "Unidentified Bite",
    symptoms: ["Visible mark on skin", "Discomfort or itching"],
    treatment: ["Keep clean", "Monitor for changes"],
    seekDoctor: ["Severe pain", "Spreading redness", "Systemic symptoms"],
    severity: "medium"
  }
};

export const FALLBACK_INFO: BiteInfo = BITE_DATABASE["unknown"];