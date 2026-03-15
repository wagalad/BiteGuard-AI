import { BiteInfo } from './types';

export const MODEL_URL = "https://teachablemachine.withgoogle.com/models/kqrcjxnHU/";

// Mapping common model labels to detailed medical info
// Keys are normalized to lowercase for matching
export const BITE_DATABASE: Record<string, BiteInfo> = {
  "mosquitos": {
    name: "Mosquito Bite",
    symptoms: ["Red, puffy bump", "Itching", "Localized swelling"],
    treatment: ["Wash with soap and water", "Apply ice pack", "Use anti-itch cream or antihistamine"],
    seekDoctor: ["Signs of infection (pus, warmth)", "Fever", "Severe headache or body aches"],
    severity: "low"
  },
  "ticks": {
    name: "Tick Bite",
    symptoms: ["Small red bump", "Tick may still be attached", "Red 'bullseye' rash (Lyme disease warning)"],
    treatment: ["Remove tick carefully with tweezers", "Clean area with alcohol", "Save tick for testing if possible"],
    seekDoctor: ["Bullseye rash appears", "Flu-like symptoms", "Joint pain"],
    severity: "medium"
  },
  "spiders": {
    name: "Spider Bite",
    symptoms: ["Redness", "Swelling", "Pain at site", "Two puncture marks (sometimes)"],
    treatment: ["Clean with soap and water", "Apply cool compress", "Elevate the area"],
    seekDoctor: ["Severe pain or cramping", "Difficulty breathing", "Ulceration (open sore) at site"],
    severity: "medium"
  },
  "bedbugs": {
    name: "Bed Bug Bite",
    symptoms: ["Itchy red welts in a line or zigzag", "Small red bumps", "Blisters"],
    treatment: ["Wash with soap and water", "Apply corticosteroid cream", "Take oral antihistamine"],
    seekDoctor: ["Signs of allergic reaction", "Severe infection from scratching"],
    severity: "low"
  },
  "ants": {
    name: "Ant Bite (Fire Ant)",
    symptoms: ["Red spots", "Pustules (bumps with white fluid)", "Burning sensation", "Itching"],
    treatment: ["Wash area", "Cold compress", "Antihistamine for itching"],
    seekDoctor: ["Signs of allergic reaction", "Spreading redness", "Severe swelling"],
    severity: "low"
  },
  "fleas": {
    name: "Flea Bite",
    symptoms: ["Small red bumps often in clusters", "Usually on ankles/legs", "Intense itching", "Red halo around bite"],
    treatment: ["Do not scratch", "Wash with antiseptic soap", "Apply ice or anti-itch cream"],
    seekDoctor: ["Signs of infection", "Tapeworm symptoms (rare)"],
    severity: "low"
  },
  "chiggers": {
    name: "Chigger Bite",
    symptoms: ["Small, itchy red bumps", "Intense itching", "Often in clusters around waist or ankles"],
    treatment: ["Wash with soap and water", "Apply calamine lotion", "Avoid scratching"],
    seekDoctor: ["Signs of infection", "Severe allergic reaction"],
    severity: "low"
  },
  "no bites": {
    name: "No Bite Detected",
    symptoms: ["Skin appears normal", "No clear signs of arthropod activity"],
    treatment: ["Monitor the area", "Keep skin hydrated"],
    seekDoctor: ["If symptoms develop", "If you feel unwell"],
    severity: "low"
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