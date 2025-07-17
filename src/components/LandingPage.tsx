import React from 'react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col">
      {/* Header */}
      <header className="py-6 px-8 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold text-white">Master Blaster</h1>
          <span className="ml-2 text-sm bg-blue-600 text-white px-2 py-1 rounded">BETA</span>
        </div>
        <div className="space-x-4">
          <button 
            onClick={() => window.location.href = "/sign-in"}
            className="px-4 py-2 text-white hover:text-blue-300 transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={() => window.location.href = "/sign-up"}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Register
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center px-8 py-12">
        <div className="max-w-5xl mx-auto text-center mb-16">
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Professional Audio Mastering
            <span className="text-blue-500"> Made Simple</span>
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
            Master your tracks with AI-powered audio processing. Get studio-quality sound in minutes, not months.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={() => window.location.href = "/sign-up"}
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105"
            >
              Get Started Free
            </button>
            <button 
              onClick={() => window.location.href = "/sign-in"}
              className="px-8 py-4 bg-gray-800 text-white text-lg font-semibold rounded-lg hover:bg-gray-700 transition-all transform hover:scale-105"
            >
              Try Demo
            </button>
          </div>
        </div>
        
        {/* Benefits Section */}
        <div className="w-full max-w-6xl mx-auto mb-20 px-4">
          <h3 className="text-3xl font-bold text-center text-white mb-12">Why Choose Master Blaster?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 bg-opacity-50 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all hover:transform hover:scale-105">
              <div className="flex justify-center mb-6">
                <svg className="w-16 h-16 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M3 19H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="17" cy="5" r="2" fill="currentColor"/>
                  <circle cx="7" cy="12" r="2" fill="currentColor"/>
                  <circle cx="12" cy="19" r="2" fill="currentColor"/>
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2 text-center">Professional EQ</h4>
              <p className="text-gray-300 text-center">7-band equalizer with studio-quality presets designed by audio professionals.</p>
            </div>
            <div className="bg-gray-800 bg-opacity-50 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all hover:transform hover:scale-105">
              <div className="flex justify-center mb-6">
                <svg className="w-16 h-16 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M4 12C4 8.13401 7.13401 5 11 5C14.866 5 18 8.13401 18 12C18 15.866 14.866 19 11 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2 text-center">Dynamic Compression</h4>
              <p className="text-gray-300 text-center">SSL-style compressor with presets for streaming platforms like Spotify and YouTube.</p>
            </div>
            <div className="bg-gray-800 bg-opacity-50 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all hover:transform hover:scale-105">
              <div className="flex justify-center mb-6">
                <svg className="w-16 h-16 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-white mb-2 text-center">Real-time Processing</h4>
              <p className="text-gray-300 text-center">Hear changes instantly as you adjust settings, with visual feedback through our VU meters.</p>
            </div>
          </div>
        </div>
        
        {/* Pricing Section */}
        <div className="w-full bg-gray-900 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h3 className="text-3xl font-bold text-center text-white mb-12">Simple, Transparent Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Free Tier */}
              <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-blue-500 transition-all">
                <div className="p-6">
                  <h4 className="text-xl font-bold text-white mb-2">Free</h4>
                  <div className="text-4xl font-bold text-white mb-4">$0<span className="text-lg text-gray-400">/month</span></div>
                  <p className="text-gray-300 mb-6">Perfect for beginners and casual producers</p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                      3 projects per month
                    </li>
                    <li className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                      100MB storage
                    </li>
                    <li className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                      Basic EQ presets
                    </li>
                    <li className="flex items-center text-gray-400">
                      <svg className="w-5 h-5 mr-2 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                      Projects expire after 7 days
                    </li>
                  </ul>
                </div>
                <div className="p-6 bg-gray-900">
                  <button 
                    onClick={() => window.location.href = "/sign-up"}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Start Free
                  </button>
                </div>
              </div>
              
              {/* Pro Tier */}
              <div className="bg-gray-800 rounded-xl overflow-hidden border-2 border-blue-500 transform scale-105 z-10 shadow-xl">
                <div className="bg-blue-600 text-white text-center py-2 font-medium">MOST POPULAR</div>
                <div className="p-6">
                  <h4 className="text-xl font-bold text-white mb-2">Pro</h4>
                  <div className="text-4xl font-bold text-white mb-4">$19<span className="text-lg text-gray-400">/month</span></div>
                  <p className="text-gray-300 mb-6">For serious producers and musicians</p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                      Unlimited projects
                    </li>
                    <li className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                      5GB storage
                    </li>
                    <li className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                      All premium presets
                    </li>
                    <li className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                      Priority processing
                    </li>
                  </ul>
                </div>
                <div className="p-6 bg-gray-900">
                  <button 
                    onClick={() => window.location.href = "/sign-up"}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Get Pro
                  </button>
                </div>
              </div>
              
              {/* Studio Tier */}
              <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-blue-500 transition-all">
                <div className="p-6">
                  <h4 className="text-xl font-bold text-white mb-2">Studio</h4>
                  <div className="text-4xl font-bold text-white mb-4">$49<span className="text-lg text-gray-400">/month</span></div>
                  <p className="text-gray-300 mb-6">For professional studios and labels</p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                      Unlimited projects
                    </li>
                    <li className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                      20GB storage
                    </li>
                    <li className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                      Custom presets
                    </li>
                    <li className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                      Dedicated support
                    </li>
                  </ul>
                </div>
                <div className="p-6 bg-gray-900">
                  <button 
                    onClick={() => window.location.href = "/sign-up"}
                    className="w-full py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    Contact Sales
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 mb-4 md:mb-0">© 2023 Master Blaster. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}