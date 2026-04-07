"use client";

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, X, Heart } from 'lucide-react';
import { VolunteerInterestForm } from '@/components/forms/VolunteerInterestForm';
import type { CalendarEvent } from '@/lib/types';

interface EventDetailsModalProps {
  event: CalendarEvent | null;
  allEvents: CalendarEvent[];
  onClose: () => void;
  onSignup?: (eventId: string) => void;
  onExpressInterest?: (event: CalendarEvent) => void;
  isAuthenticated?: boolean;
}

function EventDetailsModal({ event, allEvents, onClose, onSignup, onExpressInterest, isAuthenticated }: EventDetailsModalProps) {
  if (!event) return null;

  // Check if this is an NHS Elementary event
  const isElementaryEvent = event.extendedProps.organization === 'NHS Elementary Visits';

  // Find the next upcoming elementary event (for "Express Interest")
  const getNextElementaryEvent = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const elementaryEvents = allEvents
      .filter(e => e.extendedProps.organization === 'NHS Elementary Visits')
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    // Find first event that's today or in the future
    const nextEvent = elementaryEvents.find(e => new Date(e.start) >= today);

    // Return the next event, or the clicked event if no future events
    return nextEvent || event;
  };

  const handleExpressInterest = () => {
    const targetEvent = getNextElementaryEvent();
    if (onExpressInterest) {
      onExpressInterest(targetEvent);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{event.title}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{event.extendedProps.organization}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>{new Date(event.start + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}</span>
          </div>

          {event.extendedProps.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span>{event.extendedProps.location}</span>
            </div>
          )}

          {event.extendedProps.description && (
            <p className="text-sm text-gray-600">{event.extendedProps.description}</p>
          )}

          {/* NHS Elementary specific notice */}
          {isElementaryEvent && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                <strong>Note:</strong> This form collects interest for NHS Elementary School Visits.
                Official signup is through the Remind app.
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {isElementaryEvent ? (
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleExpressInterest}
              >
                <Heart className="w-4 h-4 mr-2" />
                Express Interest
              </Button>
            ) : (
              isAuthenticated && onSignup && (
                <Button
                  className="flex-1"
                  onClick={() => onSignup(event.id)}
                  style={{ backgroundColor: event.color }}
                >
                  Sign Up
                </Button>
              )
            )}
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface EventCalendarProps {
  onSignup?: (eventId: string) => void;
  isAuthenticated?: boolean;
}

export function EventCalendar({ onSignup, isAuthenticated }: EventCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInterestForm, setShowInterestForm] = useState(false);
  const [interestFormEvent, setInterestFormEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events/calendar');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventClick = (info: { event: { id: string } }) => {
    const event = events.find(e => e.id === info.event.id);
    if (event) {
      setSelectedEvent(event);
    }
  };

  const handleExpressInterest = (event: CalendarEvent) => {
    setInterestFormEvent(event);
    setShowInterestForm(true);
  };

  // Create unique organizations for legend
  const organizations = Array.from(
    new Map(events.map(e => [e.extendedProps.organizationId, {
      name: e.extendedProps.organization,
      color: e.color
    }])).values()
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">Loading calendar...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Volunteer Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Canvas calendar notice */}
        <div className="p-3 mb-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            <strong>Note:</strong> The Canvas calendar is the most up-to-date source for events and meetings.
          </p>
        </div>

        {/* Legend */}
        {organizations.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b">
            {organizations.map((org, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: org.color }}
                />
                <span>{org.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Calendar */}
        <div className="fc-custom">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events.map(e => ({
              id: e.id,
              title: e.title,
              start: e.start,
              end: e.end,
              backgroundColor: e.color,
              borderColor: e.color,
            }))}
            eventClick={handleEventClick}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek'
            }}
            height="auto"
            eventDisplay="block"
            dayMaxEvents={3}
          />
        </div>

        {/* Event Details Modal */}
        <EventDetailsModal
          event={selectedEvent}
          allEvents={events}
          onClose={() => setSelectedEvent(null)}
          onSignup={onSignup}
          onExpressInterest={handleExpressInterest}
          isAuthenticated={isAuthenticated}
        />

        {/* Volunteer Interest Form for Elementary Events */}
        {showInterestForm && interestFormEvent && (
          <VolunteerInterestForm
            opportunity={{
              id: 'nhs-elementary',
              title: interestFormEvent.title,
              description: interestFormEvent.extendedProps.description || 'NHS Elementary School Visit',
              location: interestFormEvent.extendedProps.location || 'Various Elementary Schools',
              duration: '2-3 hours',
              date: new Date(interestFormEvent.start + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })
            }}
            onClose={() => {
              setShowInterestForm(false);
              setInterestFormEvent(null);
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
