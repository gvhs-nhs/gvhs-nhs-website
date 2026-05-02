"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Users, Camera, MapPin, Calendar, Gamepad2, HandHeart, Laptop, Mail, ExternalLink, BookOpen, Globe, Monitor, Sparkles, Building, AlertCircle } from "lucide-react";
import Image from "next/image";
import { VolunteerInterestForm } from "@/components/forms/VolunteerInterestForm";
import type { Organization, VolunteerEvent } from "@/lib/types";

// Icon mapping for dynamic icon rendering
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "Users": Users,
  "Gamepad2": Gamepad2,
  "HandHeart": HandHeart,
  "Laptop": Laptop,
  "Camera": Camera,
  "Heart": Heart,
  "BookOpen": BookOpen,
  "Globe": Globe,
  "Monitor": Monitor,
  "Sparkles": Sparkles,
  "Building": Building
};

// Logo mapping for organizations with custom logos
const logoMap: Record<string, string> = {
  "kids-in-motion": "/images/kids-in-motion-logo.png",
  "gvco-tech-seniors": "/images/gvco-logo.jpg"
};

interface OrganizationWithEvents extends Organization {
  upcomingEvents?: VolunteerEvent[];
}

interface SubmittedInterest {
  event_id: string;
  name: string;
  email: string;
  message: string;
  preferred_contact: string;
  preferred_school?: string;
  teacher_last_name?: string;
  teacher_email?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  has_own_ride?: string;
  willing_to_take_others?: string;
  created_at: string;
}

export function VolunteeringPage() {
  const { user, isAuthenticated } = useAuth();
  const [organizations, setOrganizations] = useState<OrganizationWithEvents[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [suggestionForm, setSuggestionForm] = useState({
    opportunityTitle: "",
    description: "",
    organizationName: "",
    contactInfo: "",
    estimatedHours: "",
    preferredLocation: ""
  });
  const [submittingForm, setSubmittingForm] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [selectedOrganization, setSelectedOrganization] = useState<OrganizationWithEvents | null>(null);
  const [showInterestForm, setShowInterestForm] = useState(false);
  const [submittedInterests, setSubmittedInterests] = useState<Map<string, SubmittedInterest>>(new Map());

  useEffect(() => {
    fetchOrganizationsAndEvents();
  }, []);

  // Fetch user's submitted interests
  useEffect(() => {
    if (isAuthenticated && user?.userId) {
      fetchSubmittedInterests();
    }
  }, [isAuthenticated, user?.userId]);

  const fetchSubmittedInterests = async () => {
    try {
      const response = await fetch(`/api/volunteer-interest?userId=${user?.userId}&includeDetails=true`);
      if (response.ok) {
        const data = await response.json();
        const interestsMap = new Map<string, SubmittedInterest>();
        data.forEach((interest: SubmittedInterest) => {
          interestsMap.set(interest.event_id, interest);
        });
        setSubmittedInterests(interestsMap);
      }
    } catch (error) {
      console.error('Error fetching submitted interests:', error);
    }
  };

  const fetchOrganizationsAndEvents = async () => {
    try {
      // Fetch organizations and events in parallel
      const [orgsResponse, eventsResponse] = await Promise.all([
        fetch('/api/organizations'),
        fetch('/api/events')
      ]);

      const orgsData = await orgsResponse.json();
      const eventsData = await eventsResponse.json();

      // Match events to organizations, excluding NHS Meetings
      const orgsWithEvents: OrganizationWithEvents[] = orgsData
        .filter((org: Organization) => org.slug !== 'nhs-meetings') // Exclude NHS Meetings
        .map((org: Organization) => {
          const orgEvents = eventsData.filter((event: VolunteerEvent & { volunteer_organizations?: { id: string } }) =>
            event.organization_id === org.id || event.volunteer_organizations?.id === org.id
          );
          // Get upcoming events (from today forward)
          const today = new Date().toISOString().split('T')[0];
          const upcomingEvents = orgEvents
            .filter((e: VolunteerEvent) => e.event_date >= today)
            .slice(0, 3); // Show max 3 upcoming events

          return {
            ...org,
            upcomingEvents
          };
        });

      setOrganizations(orgsWithEvents);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionSubmit = async () => {
    if (!isAuthenticated) {
      setFormMessage("You must be logged in to suggest opportunities.");
      return;
    }

    if (!suggestionForm.opportunityTitle || !suggestionForm.description) {
      setFormMessage("Please fill in the required fields (opportunity title and description).");
      return;
    }

    setSubmittingForm(true);
    try {
      const response = await fetch("/api/opportunity-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...suggestionForm,
          nhsUserId: user?.userId,
          submittedBy: user?.username || `${user?.firstName} ${user?.lastName}`.trim()
        }),
      });

      if (response.ok) {
        setFormMessage("Thank you! Your suggestion has been submitted and will be reviewed by the NHS leadership.");
        setSuggestionForm({
          opportunityTitle: "",
          description: "",
          organizationName: "",
          contactInfo: "",
          estimatedHours: "",
          preferredLocation: ""
        });
        setTimeout(() => {
          setShowSuggestionForm(false);
          setFormMessage("");
        }, 3000);
      } else {
        setFormMessage("Error submitting suggestion. Please try again.");
      }
    } catch {
      setFormMessage("Error connecting to server. Please try again.");
    } finally {
      setSubmittingForm(false);
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderContactAction = (org: OrganizationWithEvents) => {
    const hasWebsite = org.website;
    const hasEmail = org.contact_email;
    // Always show Express Interest for NHS Elementary; also show for Interact Club and orgs with morabito email
    const showInterest = org.slug === 'nhs-elementary' || org.slug === 'interact-club' || (hasEmail && org.contact_email?.includes('morabito'));

    return (
      <div className="space-y-2">
        {/* Express Interest Button */}
        {showInterest && (() => {
          const eventId = org.slug || org.id;
          const existingSubmission = submittedInterests.get(eventId);
          const hasSubmitted = !!existingSubmission;

          if (org.slug === 'nhs-elementary') {
            return (
              <Button
                className="w-full mb-2 bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  alert("📍 NHS Elementary Visits\n\nPlease RSVP Through Canvas or the Google Form sent via Remind. This site is for tracking your service hours, but actual registration is handled by Dr. Morabito on those platforms.");
                }}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                How to RSVP
              </Button>
            );
          }

          return (
            <Button
              className={`w-full mb-2 ${hasSubmitted ? 'bg-green-700 hover:bg-green-800' : 'bg-green-600 hover:bg-green-700'}`}
              onClick={() => {
                setSelectedOrganization(org);
                setShowInterestForm(true);
              }}
            >
              <Heart className={`w-4 h-4 mr-2 ${hasSubmitted ? 'fill-white' : ''}`} />
              {hasSubmitted ? 'View Submission' : 'Express Interest'}
            </Button>
          );
        })()}

        {/* Website Link */}
        {hasWebsite && (
          <a
            href={org.website}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full block"
          >
            <Button className={`w-full ${org.slug === 'kids-in-motion' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Visit Website
            </Button>
          </a>
        )}

        {/* Email Contact */}
        {hasEmail && (
          <>
            <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-4 h-4 text-gray-500" />
              <a
                href={`mailto:${org.contact_email}`}
                className="text-blue-600 hover:underline text-sm font-medium"
              >
                {org.contact_email}
              </a>
            </div>
            {showInterest && (
              <p className="text-xs text-gray-500 text-center">
                Use &apos;Express Interest&apos; above for easier contact, or email directly
              </p>
            )}
          </>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 pt-24">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-500">Loading volunteer opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 pt-24">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-royal-blue mb-4">
            Volunteer Opportunities
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Make a difference in your community through National Honor Society volunteer opportunities.
            Choose from various ways to give back and earn service hours.
          </p>
        </div>


        {/* Organizations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <Card key={org.id} className="h-full flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {logoMap[org.slug] ? (
                      <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-white flex items-center justify-center">
                        <Image
                          src={logoMap[org.slug]}
                          alt={`${org.name} logo`}
                          width={48}
                          height={48}
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div
                        className="p-2 rounded-lg text-white"
                        style={{ backgroundColor: org.color }}
                      >
                        {(() => {
                          const IconComponent = iconMap[org.icon_name] || Users;
                          return <IconComponent className="w-6 h-6" />;
                        })()}
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-xl">{org.name}</CardTitle>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                <p className="text-gray-600 mb-4 flex-1">
                  {org.description}
                </p>

                {/* Upcoming Events */}
                {org.upcomingEvents && org.upcomingEvents.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-sm text-blue-800 mb-2 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Upcoming Events
                    </h4>
                    <div className="space-y-1">
                      {org.upcomingEvents.map((event) => (
                        <div key={event.id} className="text-sm">
                          <span className="font-medium text-blue-700">{formatEventDate(event.event_date)}</span>
                          <span className="text-gray-600"> - {event.title}</span>
                          {event.location && (
                            <span className="text-gray-500 text-xs block flex items-center gap-1 ml-0">
                              <MapPin className="w-3 h-3" />{event.location}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button/Contact Info */}
                {renderContactAction(org)}
              </CardContent>
            </Card>
          ))}
        </div>

        {organizations.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No volunteer opportunities available at the moment.</p>
          </div>
        )}

        {/* Call to Action / Suggestion Form */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-8">
            {!showSuggestionForm ? (
              <div className="text-center">
                <h3 className="text-2xl font-bold text-blue-800 mb-4">
                  Have an Idea for a New Opportunity?
                </h3>
                <p className="text-blue-600 mb-6 max-w-2xl mx-auto">
                  We&apos;re always looking for new ways to serve our community. If you have an idea for a volunteer opportunity
                  or know of an organization that could use our help, let us know!
                </p>
                {isAuthenticated ? (
                  <Button
                    onClick={() => setShowSuggestionForm(true)}
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    Suggest New Opportunity
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-amber-700 font-medium">
                      Please log in to suggest new volunteer opportunities
                    </p>
                    <p className="text-xs text-gray-600">
                      Use the Login button in the top navigation to access this feature
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="text-2xl font-bold text-blue-800 mb-6 text-center">
                  Suggest a New Volunteer Opportunity
                </h3>
                <div className="max-w-2xl mx-auto space-y-4">
                  {/* User Info Display */}
                  {isAuthenticated && user ? (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Submitting as:</h4>
                      <div className="text-sm text-blue-800">
                        <p><strong>Name:</strong> {user.username || `${user.firstName} ${user.lastName}`.trim()}</p>
                        <p><strong>NHS ID:</strong> {user.userId}</p>
                        {user.email && <p><strong>Email:</strong> {user.email}</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <p className="text-amber-800 font-medium">Please log in to suggest volunteer opportunities.</p>
                      <p className="text-amber-700 text-sm mt-1">You need to be authenticated to submit suggestions.</p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="opportunityTitle">Opportunity Title *</Label>
                    <Input
                      id="opportunityTitle"
                      value={suggestionForm.opportunityTitle}
                      onChange={(e) => setSuggestionForm(prev => ({ ...prev, opportunityTitle: e.target.value }))}
                      placeholder="e.g., Local Food Bank Volunteering"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <textarea
                      id="description"
                      value={suggestionForm.description}
                      onChange={(e) => setSuggestionForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the volunteer opportunity, what volunteers would do, and why it would benefit the community..."
                      rows={4}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="organizationName">Organization Name</Label>
                      <Input
                        id="organizationName"
                        value={suggestionForm.organizationName}
                        onChange={(e) => setSuggestionForm(prev => ({ ...prev, organizationName: e.target.value }))}
                        placeholder="e.g., Chester County Food Bank"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="estimatedHours">Estimated Hours</Label>
                      <Input
                        id="estimatedHours"
                        value={suggestionForm.estimatedHours}
                        onChange={(e) => setSuggestionForm(prev => ({ ...prev, estimatedHours: e.target.value }))}
                        placeholder="e.g., 2-3 hours per session"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="contactInfo">Contact Information</Label>
                    <Input
                      id="contactInfo"
                      value={suggestionForm.contactInfo}
                      onChange={(e) => setSuggestionForm(prev => ({ ...prev, contactInfo: e.target.value }))}
                      placeholder="Email or phone number for the organization"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="preferredLocation">Preferred Location</Label>
                    <Input
                      id="preferredLocation"
                      value={suggestionForm.preferredLocation}
                      onChange={(e) => setSuggestionForm(prev => ({ ...prev, preferredLocation: e.target.value }))}
                      placeholder="e.g., Malvern, West Chester, or Remote"
                      className="mt-1"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleSuggestionSubmit}
                      disabled={submittingForm}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {submittingForm ? "Submitting..." : "Submit Suggestion"}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowSuggestionForm(false);
                        setFormMessage("");
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>

                  {formMessage && (
                    <div className={`p-3 rounded-lg text-center text-sm ${formMessage.includes("Error")
                      ? "bg-red-50 text-red-700"
                      : "bg-green-50 text-green-700"
                      }`}>
                      {formMessage}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Volunteer Interest Form Modal */}
        {showInterestForm && selectedOrganization && (
          <VolunteerInterestForm
            opportunity={{
              id: selectedOrganization.slug || selectedOrganization.id,
              title: selectedOrganization.name,
              description: selectedOrganization.description,
              location: "Various",
              duration: "Varies",
              date: "Ongoing"
            }}
            existingSubmission={submittedInterests.get(selectedOrganization.slug || selectedOrganization.id)}
            onClose={() => {
              setShowInterestForm(false);
              setSelectedOrganization(null);
              // Refresh submitted interests to update the heart icon
              if (isAuthenticated && user?.userId) {
                fetchSubmittedInterests();
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
