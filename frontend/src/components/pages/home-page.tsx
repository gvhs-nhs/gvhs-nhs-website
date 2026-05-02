"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Award,
  BookOpen,
  Users,
  Heart,
  Mail,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { AnnouncementsBanner } from "@/components/home/AnnouncementsBanner";
import { EventCalendar } from "@/components/calendar/EventCalendar";
import { useAuth } from "@/hooks/useAuth";

// Cache-busting comment: Updated 2024-12-09 - Force refresh for button changes
export function HomePage() {
  const { isAuthenticated } = useAuth();

  const pillars = [
    {
      name: "Scholarship",
      icon: <BookOpen className="w-10 h-10" />,
      gradient: "from-blue-500 to-blue-700",
      glow: "shadow-blue-500/25",
    },
    {
      name: "Service",
      icon: <Heart className="w-10 h-10" />,
      gradient: "from-emerald-500 to-emerald-700",
      glow: "shadow-emerald-500/25",
    },
    {
      name: "Leadership",
      icon: <Users className="w-10 h-10" />,
      gradient: "from-amber-500 to-amber-700",
      glow: "shadow-amber-500/25",
    },
    {
      name: "Character",
      icon: <Award className="w-10 h-10" />,
      gradient: "from-purple-500 to-purple-700",
      glow: "shadow-purple-500/25",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4">

        {/* Hero Section */}
        <section className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            GVHS National Honor Society
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Scholarship • Service • Leadership • Character
          </p>
          <p className="text-gray-600 max-w-3xl mx-auto italic">
            &quot;The purpose of this chapter shall be to create an enthusiasm for scholarship,
            to stimulate a desire to render service, to promote worthy leadership, and to
            encourage the development of character in students of Great Valley High School.&quot;
          </p>
        </section>

        {/* Announcements */}
        <AnnouncementsBanner />

        {/* The Four Pillars */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            The Four Pillars of NHS
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {pillars.map((pillar) => (
              <div
                key={pillar.name}
                className={`group relative flex flex-col items-center justify-center p-8 rounded-2xl bg-gradient-to-br ${pillar.gradient} text-white shadow-lg ${pillar.glow} hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-default aspect-square`}
              >
                <div className="mb-4 p-4 bg-white/20 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition-colors duration-300">
                  {pillar.icon}
                </div>
                <h3 className="text-lg font-bold tracking-wide">{pillar.name}</h3>
              </div>
            ))}
          </div>
        </section>

        {/* Volunteer Events Calendar */}
        <section className="mb-12">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Upcoming Volunteer Events
            </h2>
            <p className="text-gray-600">
              View and sign up for volunteer opportunities
            </p>
          </div>
          <EventCalendar isAuthenticated={isAuthenticated} />
        </section>

        {/* Chapter Meetings Section - Compact */}
        <section className="mb-12">
          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">2025-2026 Meeting Dates</h3>
                  <p className="text-gray-600 text-sm">
                    Sep 10, Oct 8, Nov 12, Dec 10, Jan 14, Feb 11, Mar 11, Apr 15, May 20 <span className="text-amber-600 font-medium">(Juniors only)</span>
                  </p>
                </div>
                <div className="text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                  <span><strong>Times:</strong> 7:15 AM or 2:35 PM</span>
                  <span><strong>Location:</strong> Auditorium</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Member Requirements & Contact - Side by Side */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Member Requirements */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Member Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-royal-blue mt-0.5" />
                <div>
                  <p className="font-semibold">Monthly Meetings</p>
                  <p className="text-sm text-gray-600">
                    Attend 1 meeting per month (AM or PM option available)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-royal-blue mt-0.5" />
                <div>
                  <p className="font-semibold">Service Projects</p>
                  <p className="text-sm text-gray-600">
                    Participate in chapter service + complete an Individual Service Project (ISP)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-royal-blue mt-0.5" />
                <div>
                  <p className="font-semibold">Academic Standing</p>
                  <p className="text-sm text-gray-600">
                    Maintain a cumulative GPA of 3.75 or higher
                  </p>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="font-bold text-royal-blue text-lg">Annual Dues: $20</p>
                <p className="text-sm text-gray-600">Due by September 12</p>
              </div>
            </CardContent>
          </Card>

          {/* Faculty Advisor */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Faculty Advisor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900">Dr. Paige Morabito</h3>
                <p className="text-gray-600">NHS Faculty Advisor</p>
                <p className="text-sm text-gray-500">Room 130</p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Mail className="w-5 h-5 text-royal-blue" />
                <a
                  href="mailto:pmorabito@gvsd.org"
                  className="text-royal-blue hover:underline font-medium"
                >
                  pmorabito@gvsd.org
                </a>
              </div>

              <Button asChild className="w-full bg-royal-blue hover:bg-blue-700">
                <a href="mailto:pmorabito@gvsd.org">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Dr. Morabito
                </a>
              </Button>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                <p className="text-sm font-medium text-amber-800">ISP Questions?</p>
                <p className="text-xs text-amber-700">
                  Contact Dr. Morabito before September 19 to discuss your Individual Service Project
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Quick Links */}
        <section className="mb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/eligibility">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 text-center">
                  <Award className="w-8 h-8 text-royal-blue mx-auto mb-2" />
                  <p className="font-semibold">Eligibility</p>
                  <p className="text-xs text-gray-600">Selection process & requirements</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/volunteering">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 text-center">
                  <Heart className="w-8 h-8 text-royal-blue mx-auto mb-2" />
                  <p className="font-semibold">Volunteering</p>
                  <p className="text-xs text-gray-600">Service opportunities</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/tutor/checkin">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 text-center">
                  <BookOpen className="w-8 h-8 text-royal-blue mx-auto mb-2" />
                  <p className="font-semibold">Tutoring</p>
                  <p className="text-xs text-gray-600">Check in for tutoring</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/tutor/profile">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 text-center">
                  <Users className="w-8 h-8 text-royal-blue mx-auto mb-2" />
                  <p className="font-semibold">Profile</p>
                  <p className="text-xs text-gray-600">Manage your tutor profile</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* Bottom Quote */}
        <section>
          <Card className="bg-royal-blue text-white text-center">
            <CardContent className="py-6 px-8">
              <p className="text-lg font-medium">
                &quot;Membership in the National Honor Society is both an honor and a responsibility.
                We are committed to upholding the pillars of Service, Leadership, Scholarship, and Character
                in everything we do.&quot;
              </p>
            </CardContent>
          </Card>
        </section>

      </div>
    </div>
  );
}
