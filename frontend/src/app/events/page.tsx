'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';

interface Event {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  isUserEvent?: boolean;
}

export default function EventsPage() {
  // This would come from your API/database
  const events: Event[] = [
    {
      id: '1',
      name: 'ETH Taipei 2024',
      description: 'Join us for the biggest Ethereum event in Taipei',
      imageUrl: '/images/eth-taipei.jpg',
      location: 'Taipei, Taiwan',
      date: '2024-03-21',
      startTime: '09:00',
      endTime: '18:00',
      isUserEvent: true
    },
    {
      id: '2',
      name: 'Web3 Summit',
      description: 'A gathering of Web3 enthusiasts and builders',
      imageUrl: '/images/web3-summit.jpg',
      location: 'Taipei, Taiwan',
      date: '2024-04-15',
      startTime: '10:00',
      endTime: '17:00'
    }
  ];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const myEvents = events.filter(event => event.isUserEvent);
  const allEvents = events.filter(event => !event.isUserEvent);

  const EventCard = ({ event }: { event: Event }) => (
    <Link 
      href={`/events/${event.id}`}
      className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl 
                transition-shadow border-2 border-[#b89d65]"
    >
      <div className="aspect-video relative">
        <img
          src={event.imageUrl}
          alt={event.name}
          className="object-cover w-full h-full"
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-medium text-[#5a3e2b] mb-2">
          {event.name}
        </h3>
        <p className="text-[#5a3e2b]/70 text-sm mb-4">
          {event.description}
        </p>
        <div className="space-y-2">
          <div className="flex items-center text-[#5a3e2b]/70 text-sm">
            <MapPinIcon className="w-4 h-4 mr-2" />
            {event.location}
          </div>
          <div className="flex items-center text-[#5a3e2b]/70 text-sm">
            <CalendarIcon className="w-4 h-4 mr-2" />
            {formatDate(event.date)}
          </div>
          <div className="flex items-center text-[#5a3e2b]/70 text-sm">
            <ClockIcon className="w-4 h-4 mr-2" />
            {event.startTime} - {event.endTime}
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-[#f8f5e6]">
      {/* Header */}
      <div className="bg-[#f0e6c0] border-b-2 border-[#b89d65]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-serif text-[#5a3e2b]">Events</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create Event Button */}
        <div className="mb-12 text-right">
          <Link
            href="/create-event"
            className="inline-block bg-[#6b8e50] hover:bg-[#5a7a42] text-white 
                     font-medium px-8 py-3 rounded-lg transition-colors"
          >
            Create New Event
          </Link>
        </div>

        {/* My Events Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-serif text-[#5a3e2b] mb-6">My Events</h2>
          {myEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border-2 border-[#b89d65]">
              <p className="text-[#5a3e2b]/70 text-lg">
                You haven't created or joined any events yet.
              </p>
            </div>
          )}
        </div>

        {/* All Events Section */}
        <div>
          <h2 className="text-2xl font-serif text-[#5a3e2b] mb-6">All Events</h2>
          {allEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border-2 border-[#b89d65]">
              <p className="text-[#5a3e2b]/70 text-lg">
                No events found.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
