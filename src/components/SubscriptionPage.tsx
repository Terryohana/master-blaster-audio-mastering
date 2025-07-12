import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";

export function SubscriptionPage() {
  const subscriptionLimits = useQuery(api.users.getSubscriptionLimits);
  const upgradeSubscription = useMutation(api.users.upgradeSubscription);
  const [isProcessing, setIsProcessing] = useState(false);

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      period: "forever",
      tracks: 10,
      features: [
        "10 mastered tracks",
        "Basic EQ presets",
        "Standard quality",
        "Community support",
      ],
      current: subscriptionLimits?.tier === "free",
      popular: false,
    },
    {
      id: "starter",
      name: "Starter",
      price: "$9.99",
      period: "month",
      tracks: 25,
      features: [
        "25 mastered tracks/month",
        "All EQ presets",
        "High quality output",
        "Email support",
        "Priority processing",
      ],
      current: subscriptionLimits?.tier === "starter",
      popular: false,
    },
    {
      id: "pro",
      name: "Pro",
      price: "$19.99",
      period: "month",
      tracks: 50,
      features: [
        "50 mastered tracks/month",
        "All EQ presets",
        "Premium quality output",
        "Priority support",
        "Advanced analytics",
        "Custom presets",
      ],
      current: subscriptionLimits?.tier === "pro",
      popular: true,
    },
    {
      id: "unlimited",
      name: "Unlimited",
      price: "$39.99",
      period: "month",
      tracks: 100,
      features: [
        "100 mastered tracks/month",
        "All premium features",
        "Highest quality output",
        "24/7 priority support",
        "API access",
        "White-label options",
      ],
      current: subscriptionLimits?.tier === "unlimited",
      popular: false,
    },
  ];

  const handleUpgrade = async (planId: string) => {
    if (planId === "free") return;
    
    setIsProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await upgradeSubscription({ tier: planId as any });
      toast.success(`Successfully upgraded to ${planId} plan!`);
    } catch (error) {
      toast.error("Failed to upgrade subscription. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period.")) {
      return;
    }

    try {
      await upgradeSubscription({ tier: "free" });
      toast.success("Subscription cancelled. You'll retain access until the end of your billing period.");
    } catch (error) {
      toast.error("Failed to cancel subscription. Please contact support.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Choose Your Plan</h1>
        <p className="text-xl text-purple-200">
          Unlock the full potential of professional audio mastering
        </p>
      </div>

      {/* Current Usage */}
      {subscriptionLimits && (
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Current Usage</h3>
              <p className="text-purple-200">
                You've used {subscriptionLimits.used} of {subscriptionLimits.limit} tracks
              </p>
              {subscriptionLimits.tier !== "free" && (
                <p className="text-sm text-purple-300 mt-1">
                  Resets monthly • Next reset: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white capitalize">
                {subscriptionLimits.tier} Plan
              </div>
              <div className="w-48 bg-black/30 rounded-full h-3 mt-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all"
                  style={{
                    width: `${Math.min((subscriptionLimits.used / subscriptionLimits.limit) * 100, 100)}%`,
                  }}
                />
              </div>
              {subscriptionLimits.tier !== "free" && (
                <button
                  onClick={handleCancelSubscription}
                  className="mt-3 text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-black/20 backdrop-blur-sm rounded-xl p-6 border transition-all ${
              plan.popular
                ? "border-purple-500 ring-2 ring-purple-500/50 scale-105"
                : "border-purple-500/20 hover:border-purple-500/50"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                {plan.period !== "forever" && (
                  <span className="text-purple-200">/{plan.period}</span>
                )}
              </div>
              <p className="text-purple-200">{plan.tracks} tracks{plan.period !== "forever" ? "/month" : ""}</p>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-purple-200">
                  <span className="text-green-400 mr-2">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              disabled={plan.current || isProcessing}
              onClick={() => handleUpgrade(plan.id)}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                plan.current
                  ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                  : isProcessing
                  ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                  : plan.popular
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                  : "bg-purple-600 text-white hover:bg-purple-700"
              }`}
            >
              {plan.current 
                ? "Current Plan" 
                : isProcessing 
                ? "Processing..." 
                : plan.id === "free" 
                ? "Downgrade" 
                : "Upgrade Now"
              }
            </button>
          </div>
        ))}
      </div>

      {/* Payment Security Notice */}
      <div className="mt-12 bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
        <div className="flex items-center justify-center space-x-4 text-purple-200">
          <span className="text-2xl">🔒</span>
          <div>
            <h3 className="font-semibold text-white">Secure Payment Processing</h3>
            <p className="text-sm">Your payment information is encrypted and secure. Cancel anytime.</p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-white text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
            <h3 className="text-lg font-semibold text-white mb-2">
              What audio formats are supported?
            </h3>
            <p className="text-purple-200">
              We support all major audio formats including MP3, WAV, FLAC, AAC, and more.
            </p>
          </div>
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
            <h3 className="text-lg font-semibold text-white mb-2">
              How long does mastering take?
            </h3>
            <p className="text-purple-200">
              Most tracks are processed within 2-5 minutes. Pro and Unlimited users get priority processing.
            </p>
          </div>
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
            <h3 className="text-lg font-semibold text-white mb-2">
              Can I cancel anytime?
            </h3>
            <p className="text-purple-200">
              Yes, you can cancel your subscription at any time. You'll retain access until the end of your billing period.
            </p>
          </div>
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
            <h3 className="text-lg font-semibold text-white mb-2">
              Do unused tracks roll over?
            </h3>
            <p className="text-purple-200">
              Track limits reset monthly. Unused tracks don't roll over to the next month.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
