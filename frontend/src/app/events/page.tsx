'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/24/solid';

const features = [
  {
    title: "AI-Powered Networking",
    description: "Our platform uses AI to create personalized icebreaker quests that connect attendees with similar intrest and backgrounds.",
    icon: "🤖",
    accentColor: true
  },
  {
    title: "Easy Registration",
    description: "Import attendees via Excel or share a registration link where users can create detailed profiles.",
    icon: "📝"
  },
  {
    title: "Smart Matching",
    description: "Connect attendees based on shared intrest, experience levels, and location for meaningful interactions.",
    icon: "🤝",
    accentColor: true
  },
  {
    title: "Gamified Experience",
    description: "Make networking fun with interactive quests and challenges that encourage real connections.",
    icon: "🎮"
  },
  {
    title: "Verified Interactions",
    description: "Quest completion is verified through tag matching to ensure authentic engagement between attendees.",
    icon: "✅",
    accentColor: true
  },
  {
    title: "Profile Management",
    description: "Attendees can customize their profiles with intrest, experience, and location to improve matching.",
    icon: "👤"
  }
];

const sampleEvents = [
  {
    id: 1,
    name: "ETH Taipei 2024",
    image: "https://placehold.co/600x400/f0e6c0/5a3e2b",
    startDate: "2024-03-21T09:00",
    endDate: "2024-03-23T18:00",
    features: ["NFT Showcase", "DeFi Workshop", "Web3 Gaming"]
  },
  {
    id: 2,
    name: "Blockchain Summit",
    image: "https://placehold.co/600x400/f0e6c0/5a3e2b",
    startDate: "2024-04-15T10:00",
    endDate: "2024-04-17T17:00",
    features: ["Networking", "Panel Discussions", "Hackathon"]
  },
  // Add more sample events as needed
];

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-[#f8f5e6]">
      {/* Hero Section with Background Pattern */}
      <div className="relative bg-[#f0e6c0] py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pattern-grid-lg"></div>
        <div className="max-w-6xl mx-auto px-8 relative">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-serif text-[#5a3e2b] mb-6 leading-tight">
              Connect. Engage.{" "}
              <span className="text-[#6b8e50]">Transform.</span>
            </h1>
            <p className="text-xl md:text-2xl text-[#5a3e2b]/80 mb-12 max-w-3xl mx-auto leading-relaxed">
              Transform your events with AI-powered networking quests that make connections meaningful and fun.
            </p>
            <div className="flex gap-4 justify-center">
              <Link 
                href="/create-event"
                className="inline-block bg-[#6b8e50] hover:bg-[#5a7a42] text-[#f8f5e6] 
                         font-medium px-8 py-4 rounded-lg border-2 border-[#5a7a42] 
                         transition-all transform hover:scale-105 
                         focus:outline-none focus:ring-2 focus:ring-[#6b8e50]"
              >
                Create New Event
              </Link>
              <Link 
                href="#features"
                className="inline-block bg-[#b89d65] hover:bg-[#a08a55] text-[#f8f5e6] 
                         font-medium px-8 py-4 rounded-lg border-2 border-[#8c7851] 
                         transition-all transform hover:scale-105
                         focus:outline-none focus:ring-2 focus:ring-[#b89d65]"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-20">
        {/* Features Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`rounded-xl p-8 border-2 transition-all transform hover:-translate-y-1 hover:shadow-xl
                        ${feature.accentColor 
                          ? 'bg-[#6b8e50] border-[#5a7a42] text-[#f8f5e6]' 
                          : 'bg-[#f0e6c0] border-[#b89d65] text-[#5a3e2b]'}`}
            >
              <div className="text-5xl mb-6">{feature.icon}</div>
              <h3 className={`text-2xl font-serif mb-4 ${feature.accentColor ? 'text-[#f8f5e6]' : 'text-[#5a3e2b]'}`}>
                {feature.title}
              </h3>
              <p className={feature.accentColor ? 'text-[#f8f5e6]/90' : 'text-[#5a3e2b]/80'}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* How It Works Section - Updated with arrows */}
        <div className="mt-32">
          <h2 className="text-4xl font-serif text-[#5a3e2b] text-center mb-16">
            How It <span className="text-[#6b8e50]">Works</span>
          </h2>
          <div className="flex flex-col md:flex-row gap-4 justify-center items-stretch relative">
            {[
              {
                step: "1",
                title: "Create Event",
                description: "Set up your event and customize networking parameters"
              },
              {
                step: "2",
                title: "Add Attendees",
                description: "Import attendee list or share registration link"
              },
              {
                step: "3",
                title: "Generate Quests",
                description: "AI creates personalized networking challenges"
              },
              {
                step: "4",
                title: "Track Engagement",
                description: "Monitor connections and quest completions"
              }
            ].map((step, index, array) => (
              <div key={index} className="flex-1 relative">
                <div className="text-center bg-[#f0e6c0] rounded-xl p-8 border-2 border-[#b89d65]
                             transition-all transform hover:-translate-y-1 hover:shadow-xl h-full">
                  <div className="w-16 h-16 rounded-full bg-[#6b8e50] text-[#f8f5e6] 
                              flex items-center justify-center text-2xl font-bold mx-auto mb-6
                              border-4 border-[#f8f5e6] relative z-10">
                    {step.step}
                  </div>
                  <h3 className="text-2xl font-serif text-[#5a3e2b] mb-4">
                    {step.title}
                  </h3>
                  <p className="text-[#5a3e2b]/80 text-lg">
                    {step.description}
                  </p>
                </div>
                {index < array.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-20">
                    <div className="w-12 h-12 rounded-full bg-[#6b8e50] flex items-center justify-center
                                shadow-lg border-2 border-[#f8f5e6]">
                      <ChevronRightIcon className="w-6 h-6 text-[#f8f5e6]" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Featured Events Section */}
        <div className="mt-32">
          <h2 className="text-4xl font-serif text-[#5a3e2b] text-center mb-16">
            Featured <span className="text-[#6b8e50]">Events</span>
          </h2>
          <div className="overflow-x-auto pb-6">
            <div className="flex gap-6 min-w-max px-4">
              {sampleEvents.map((event) => (
                <div 
                  key={event.id}
                  className="w-[400px] bg-[#f0e6c0] rounded-xl overflow-hidden border-2 border-[#b89d65]
                           transition-all hover:shadow-xl"
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                      src={event.image} 
                      alt={event.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-serif text-[#5a3e2b] mb-4">
                      {event.name}
                    </h3>
                    <div className="space-y-2 mb-4">
                      <p className="text-[#5a3e2b]/80">
                        <span className="font-medium">Starts:</span>{' '}
                        {new Date(event.startDate).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-[#5a3e2b]/80">
                        <span className="font-medium">Ends:</span>{' '}
                        {new Date(event.endDate).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {event.features.map((feature, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 rounded-full bg-[#6b8e50]/10 text-[#6b8e50] 
                                   border border-[#6b8e50] text-sm"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-32 text-center bg-[#6b8e50] rounded-2xl p-16 border-2 border-[#5a7a42]">
          <h2 className="text-4xl font-serif text-[#f8f5e6] mb-6">
            Ready to Transform Your Events?
          </h2>
          <p className="text-xl text-[#f8f5e6]/90 mb-8 max-w-2xl mx-auto">
            Join the future of event networking and create meaningful connections.
          </p>
          <Link 
            href="/create-event"
            className="inline-block bg-[#f8f5e6] hover:bg-[#f0e6c0] text-[#6b8e50] 
                     font-medium px-10 py-4 rounded-lg border-2 border-[#f8f5e6] 
                     transition-all transform hover:scale-105
                     focus:outline-none focus:ring-2 focus:ring-[#f8f5e6]"
          >
            Get Started Now
          </Link>
        </div>
      </div>
    </div>
  );
}
