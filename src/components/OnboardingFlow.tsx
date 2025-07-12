import { useState } from "react";

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Master Blaster",
      description: "Transform your audio tracks with professional EQ mastering presets",
      icon: "🎵",
    },
    {
      title: "Upload Your Tracks",
      description: "Simply drag and drop or select your audio files to get started",
      icon: "📁",
    },
    {
      title: "Choose Your Sound",
      description: "Select from 20 professionally crafted EQ presets for any genre",
      icon: "🎛️",
    },
    {
      title: "Download & Share",
      description: "Get your mastered tracks instantly and share your music with the world",
      icon: "⬇️",
    },
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const skipOnboarding = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-3xl">{steps[currentStep].icon}</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">{steps[currentStep].title}</h2>
          <p className="text-purple-200 text-lg">{steps[currentStep].description}</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index === currentStep ? "bg-purple-500" : "bg-purple-500/30"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={nextStep}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            {currentStep === steps.length - 1 ? "Get Started" : "Next"}
          </button>
          
          <button
            onClick={skipOnboarding}
            className="w-full text-purple-300 py-2 hover:text-white transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
