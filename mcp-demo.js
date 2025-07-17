/**
 * MCP Demo for Master Blaster Audio Mastering App
 * This demonstrates how the MCP implementation works with Amazon Q
 */

import MasterBlasterMCP from './amazon-q-mcp.js';

// Create a simple mock for Amazon Q API responses
const mockAmazonQResponse = (query) => {
  return {
    content: `Here's my response to your question: "${query}"`,
    metadata: {
      model: "amazon-q",
      tokensUsed: 150
    }
  };
};

// Demo function
async function runMCPDemo() {
  console.log("=== MASTER BLASTER MCP DEMO ===");
  console.log("Initializing MCP...");
  
  // Initialize the MCP
  const mcp = new MasterBlasterMCP();
  
  // Step 1: Set up app state context
  console.log("\n1. Setting up application state context...");
  mcp.updateAppState({
    activeAudioMode: 'eq',
    isPlaying: true,
    currentTime: 45.2,
    audioFile: 'vocals-take3.wav',
    isLiveEQEnabled: true,
    projectData: {
      name: "Vocal Mix Session",
      sampleRate: 48000,
      bitDepth: 24
    }
  });
  
  // Step 2: Add audio processing context
  console.log("\n2. Adding audio processing context...");
  mcp.updateAudioProcessing({
    eqSettings: [
      { frequency: 100, gain: 2, Q: 1, type: "lowshelf" },
      { frequency: 400, gain: -3, Q: 1.2, type: "peaking" },
      { frequency: 1000, gain: -1, Q: 1, type: "peaking" },
      { frequency: 3000, gain: 2, Q: 0.8, type: "peaking" },
      { frequency: 10000, gain: 3, Q: 1, type: "highshelf" }
    ],
    compressorSettings: {
      threshold: -24,
      ratio: 4,
      attack: 0.003,
      release: 0.25,
      knee: 6
    },
    audioAnalysis: {
      peakLevel: -3.2,
      rmsLevel: -18.5,
      crestFactor: 15.3,
      spectralCentroid: 2450,
      lowEndIssues: "Some muddiness around 250-350Hz"
    }
  });
  
  // Step 3: Add user context
  console.log("\n3. Adding user context...");
  mcp.updateUserContext({
    preferences: {
      defaultEQPreset: "Vocal Clarity",
      preferredCompressorModel: "Opto",
      theme: "dark"
    },
    recentProjects: [
      "Vocal Mix Session",
      "Drum Processing",
      "Full Band Master"
    ],
    savedPresets: [
      { name: "Vocal Clarity", type: "eq" },
      { name: "Drum Punch", type: "compressor" },
      { name: "Mastering Chain", type: "chain" }
    ]
  });
  
  // Step 4: Add documentation context
  console.log("\n4. Adding documentation context...");
  mcp.updateDocumentation({
    webAudioAPI: {
      eqFilters: "BiquadFilterNode can be used to create various filter types...",
      dynamicsProcessing: "DynamicsCompressorNode provides compression functionality..."
    },
    audioProcessingTips: {
      vocalEQ: "For clear vocals, consider cutting around 250-400Hz to reduce muddiness...",
      compression: "Vocals typically benefit from medium attack (2-5ms) and medium-fast release..."
    }
  });
  
  // Step 5: First query to Amazon Q
  console.log("\n5. First query to Amazon Q...");
  const question1 = "How can I reduce the muddiness in my vocal track?";
  console.log(`User question: "${question1}"`);
  
  const queryPayload1 = await mcp.queryAmazonQ(question1);
  console.log("Context sent to Amazon Q:");
  console.log(JSON.stringify(queryPayload1.context, null, 2).substring(0, 500) + "...");
  
  // Mock response from Amazon Q
  const response1 = mockAmazonQResponse(question1);
  mcp.handleResponse(response1);
  console.log("Amazon Q response:", response1.content);
  
  // Step 6: Follow-up question (showing conversation context)
  console.log("\n6. Follow-up question (showing conversation context)...");
  const question2 = "What EQ settings should I adjust specifically?";
  console.log(`User question: "${question2}"`);
  
  const queryPayload2 = await mcp.queryAmazonQ(question2);
  console.log("Context sent to Amazon Q (notice the conversation history is included):");
  console.log(JSON.stringify(queryPayload2.context, null, 2).substring(0, 500) + "...");
  
  // Mock response from Amazon Q
  const response2 = mockAmazonQResponse(question2);
  mcp.handleResponse(response2);
  console.log("Amazon Q response:", response2.content);
  
  // Step 7: Demonstrate context prioritization with limited tokens
  console.log("\n7. Demonstrating context prioritization with limited tokens...");
  const question3 = "How should I set the compressor for these vocals?";
  console.log(`User question: "${question3}"`);
  
  // Force a smaller context window (1000 tokens instead of 7000)
  const queryPayload3 = await mcp.queryAmazonQ(question3, 1000);
  console.log("Context sent to Amazon Q (with limited token budget):");
  console.log(JSON.stringify(queryPayload3.context, null, 2));
  console.log("Notice how only high-priority context is included when tokens are limited");
  
  console.log("\n=== MCP DEMO COMPLETE ===");
}

// Run the demo
runMCPDemo().catch(console.error);

// Export for module usage
export { runMCPDemo };