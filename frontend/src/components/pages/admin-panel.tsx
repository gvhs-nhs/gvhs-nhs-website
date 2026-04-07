"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, LogOut, Lightbulb, Eye, EyeOff, Trash2, Settings, Building2, Bell } from "lucide-react";
import { UserCard } from "@/components/admin/UserCard";
import { ActiveUsersPanel } from "@/components/admin/ActiveUsersPanel";
import { NHSElementaryVisits } from "@/components/admin/NHSElementaryVisits";
import { AdminOrganizationManager } from "@/components/admin/AdminOrganizationManager";
import { AdminAnnouncementManager } from "@/components/admin/AdminAnnouncementManager";
import { AdminUsersGrid } from "@/components/admin/AdminUsersGrid";
import { SystemSettings } from "@/components/admin/SystemSettings";

interface User {
  userId: string;
  user_id?: string;
  real_user_id?: string;
  firstName?: string;
  lastName?: string;
  first_name: string;
  last_name: string;
  username?: string;
  email: string;
  isCheckedIn?: boolean;
  checkedInAt?: string;
  createdAt?: string;
}

interface Session {
  userId?: string;
  username?: string;
  checked_in_at: string;
  checked_out_at: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  duration?: number;
  duration_ms?: number;
  forced_by_admin?: boolean;
  forcedByAdmin?: boolean;
}

interface TotalHours {
  userId: string;
  totalSessions: number;
  totalMilliseconds: number;
  totalHours: string;
}

export function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [nhsUserId, setNhsUserId] = useState("");
  const [authError, setAuthError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [opportunitySuggestions, setOpportunitySuggestions] = useState([]);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [userSessions, setUserSessions] = useState<Record<string, Session[]>>({});
  const [userHours, setUserHours] = useState<Record<string, TotalHours>>({});

  const [_deleteConfirmUserId, setDeleteConfirmUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const handleAuth = async () => {
    if (!nhsUserId) {
      setAuthError("Please enter the admin PIN");
      return;
    }

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: nhsUserId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        setAuthError("");
        fetchUsers();
        fetchOpportunitySuggestions();
      } else {
        setAuthError(data.error || "Invalid admin PIN");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setAuthError("Authentication failed");
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/checkin/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setMessage("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setMessage("Error connecting to server");
    }
    setLoading(false);
  };

  const fetchOpportunitySuggestions = async () => {
    try {
      const response = await fetch("/api/opportunity-suggestions");
      if (response.ok) {
        const data = await response.json();
        setOpportunitySuggestions(data.suggestions);
      } else {
        console.error("Failed to fetch opportunity suggestions");
      }
    } catch (error) {
      console.error("Error fetching opportunity suggestions:", error);
    }
  };

  const fetchUserSessions = async (userId: string) => {
    try {
      // Find the user to get their real database ID
      const user = users.find(u => (u.user_id || u.userId) === userId);
      const realUserId = user?.real_user_id || userId;

      console.log(`Fetching sessions for masked ID ${userId} using real ID ${realUserId}`);

      const response = await fetch(`/api/checkin/admin/session-history/${realUserId}`);
      if (response.ok) {
        const sessions = await response.json();
        setUserSessions(prev => ({ ...prev, [userId]: sessions }));
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const fetchUserHours = async (userId: string) => {
    try {
      // Find the user to get their real database ID
      const user = users.find(u => (u.user_id || u.userId) === userId);
      const realUserId = user?.real_user_id || userId;

      console.log(`Fetching hours for masked ID ${userId} using real ID ${realUserId}`);

      const response = await fetch(`/api/checkin/admin/total-hours/${realUserId}`);
      if (response.ok) {
        const hours = await response.json();
        setUserHours(prev => ({ ...prev, [userId]: hours }));
      }
    } catch (error) {
      console.error("Error fetching hours:", error);
    }
  };

  const toggleUserExpand = async (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
    } else {
      setExpandedUserId(userId);
      if (!userSessions[userId]) {
        await fetchUserSessions(userId);
      }
      if (!userHours[userId]) {
        await fetchUserHours(userId);
      }
    }
  };

  const handleForceCheckout = async (userId: string, email: string) => {
    if (!confirm(`Force checkout ${email}?`)) return;

    try {
      // Find the user to get their real database ID
      const user = users.find(u => (u.user_id || u.userId) === userId);
      const realUserId = user?.real_user_id || userId;

      console.log(`Force checkout for masked ID ${userId} using real ID ${realUserId}`);

      const response = await fetch("/api/checkin/admin/force-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: realUserId }),
      });

      if (response.ok) {
        setMessage(`Successfully checked out ${email}`);
        fetchUsers();
      } else {
        const data = await response.json();
        setMessage(data.error || "Failed to checkout user");
      }
    } catch (error) {
      console.error("Error checking out user:", error);
      setMessage("Error connecting to server");
    }
  };

  const handleChangePin = async (email: string, newPassword?: string) => {
    // If no password provided, prompt for one
    if (!newPassword) {
      const inputPassword = prompt(`Enter new password for ${email} (min 6 characters):`);
      if (!inputPassword) return; // User cancelled
      if (inputPassword.length < 6) {
        setMessage("Error: Password must be at least 6 characters");
        return;
      }
      newPassword = inputPassword;
    }

    try {
      const response = await fetch("/api/checkin/admin/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Successfully reset password for ${email}. New password: ${newPassword}`);
        fetchUsers();
      } else {
        setMessage(data.error || "Failed to reset password");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      setMessage("Error connecting to server");
    }
  };

  const handleResetNhsId = async (userId: string, email: string, newNhsId?: string) => {
    // If no NHS ID provided, prompt for one
    if (!newNhsId) {
      const inputNhsId = prompt(`Enter new NHS ID for ${email}:`);
      if (!inputNhsId) return; // User cancelled
      newNhsId = inputNhsId;
    }

    try {
      const response = await fetch("/api/checkin/admin/reset-nhs-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newNhsId }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Successfully reset NHS ID for ${email}. New NHS ID: ${newNhsId}`);
      } else {
        setMessage(data.error || "Failed to reset NHS ID");
      }
    } catch (error) {
      console.error("Error resetting NHS ID:", error);
      setMessage("Error connecting to server");
    }
  };

  const handleDeleteUserFromGrid = async (userId: string, email: string) => {
    try {
      const response = await fetch("/api/checkin/admin/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Successfully deleted user ${email} from all systems`);
      } else {
        setMessage(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setMessage("Error connecting to server");
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    setDeletingUserId(userId);
    try {
      // Find the user in the current users array to get the real database ID
      const userToDelete = users.find(u => (u.userId || u.user_id) === userId);
      const realUserId = userToDelete?.real_user_id;

      console.log('Admin Panel Delete - Masked ID:', userId);
      console.log('Admin Panel Delete - Real ID:', realUserId);
      console.log('Admin Panel Delete - User object:', userToDelete);

      if (!realUserId) {
        setMessage(`Error: Could not find database ID for user ${email}`);
        setDeletingUserId(null);
        return;
      }

      const response = await fetch("/api/checkin/admin/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: realUserId }), // Use real database ID
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Successfully deleted user ${email} (${userId}) from all systems`);
        setDeleteConfirmUserId(null);
        // Remove user from local state immediately using the masked ID for filtering
        setUsers(prev => prev.filter(user => (user.userId || user.user_id) !== userId));
        // Clear any expanded data for this user
        if (expandedUserId === userId) {
          setExpandedUserId(null);
        }
        setUserSessions(prev => {
          const newSessions = { ...prev };
          delete newSessions[userId];
          return newSessions;
        });
        setUserHours(prev => {
          const newHours = { ...prev };
          delete newHours[userId];
          return newHours;
        });
      } else {
        setMessage(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setMessage("Error connecting to server");
    }
    setDeletingUserId(null);
  };

  const formatDuration = (milliseconds: number) => {
    const totalMinutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Status update function removed - suggestions are now view-only with contact info

  const handleSuggestionDelete = async (suggestionId: string) => {
    if (!confirm("Are you sure you want to delete this suggestion? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/opportunity-suggestions/${suggestionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessage("Suggestion deleted successfully!");
        fetchOpportunitySuggestions();
        setTimeout(() => setMessage(""), 3000);
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || "Failed to delete suggestion");
      }
    } catch (error) {
      console.error("Error deleting suggestion:", error);
      setMessage("Error connecting to server");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen overflow-hidden flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center text-royal-blue text-2xl">
                <Shield className="w-6 h-6 mr-2" />
                Admin Panel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nhsUserId">Enter Admin PIN</Label>
                <div className="relative mt-2">
                  <Input
                    id="nhsUserId"
                    type={showPassword ? "text" : "password"}
                    value={nhsUserId}
                    onChange={(e) => setNhsUserId(e.target.value)}
                    placeholder="Enter admin PIN"
                    className="text-center pr-10"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-2 text-center">
                  Enter the admin PIN to access admin features
                </p>
              </div>

              <Button onClick={handleAuth} className="w-full bg-blue-600 hover:bg-blue-700">
                Access Admin Panel
              </Button>

              {authError && (
                <div className="p-3 rounded-lg text-center bg-red-50 text-red-700">
                  {authError}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-royal-blue flex items-center">
            <Shield className="w-8 h-8 mr-2" />
            NHS Admin Panel
          </h1>
          <Button onClick={() => setIsAuthenticated(false)} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg ${message.includes("Error") || message.includes("Failed")
            ? "bg-red-50 text-red-700"
            : "bg-green-50 text-green-700"
            }`}>
            {message}
          </div>
        )}

        {/* Admin Tabs */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="organizations" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Orgs & Events
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="elementary" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Elementary
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: General Admin */}
          <TabsContent value="general" className="space-y-6">
            {/* System Settings */}
            <SystemSettings />

            {/* Active Users Panel */}
            <ActiveUsersPanel onForceCheckout={() => fetchUsers()} />

            {/* Opportunity Suggestions */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2" />
                  Volunteer Opportunity Suggestions ({opportunitySuggestions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {opportunitySuggestions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No suggestions submitted yet</div>
                ) : (
                  <div className="space-y-4">
                    {opportunitySuggestions.map((suggestion: { id: string; opportunity_title: string; description: string; status: string; nhs_user_id?: string; created_at?: string; organization_name?: string; contact_info?: string; estimated_hours?: number; preferred_location?: string }) => (
                      <div key={suggestion.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{suggestion.opportunity_title}</h3>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${suggestion.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              suggestion.status === 'approved' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                              {suggestion.status}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSuggestionDelete(suggestion.id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 h-7 w-7"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-3">{suggestion.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Submitted by:</span> {suggestion.nhs_user_id}
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Submitted:</span> {suggestion.created_at ? formatDateTime(suggestion.created_at) : 'N/A'}
                          </div>
                          {suggestion.organization_name && (
                            <div>
                              <span className="font-medium text-gray-700">Organization:</span> {suggestion.organization_name}
                            </div>
                          )}
                          {suggestion.estimated_hours && (
                            <div>
                              <span className="font-medium text-gray-700">Estimated Hours:</span> {suggestion.estimated_hours}
                            </div>
                          )}
                          {suggestion.contact_info && (
                            <div>
                              <span className="font-medium text-gray-700">Contact:</span> {suggestion.contact_info}
                            </div>
                          )}
                          {suggestion.preferred_location && (
                            <div>
                              <span className="font-medium text-gray-700">Location:</span> {suggestion.preferred_location}
                            </div>
                          )}
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg mt-3 border border-blue-200">
                          <div className="text-sm font-medium text-blue-900 mb-2">
                            📧 Contact Information:
                          </div>
                          <div className="text-sm text-blue-800">
                            {suggestion.contact_info ? (
                              <>
                                <strong>Email:</strong> {suggestion.contact_info}
                                <br />
                                <strong>For:</strong> {suggestion.opportunity_title}
                                {suggestion.organization_name && (
                                  <>
                                    <br />
                                    <strong>Organization:</strong> {suggestion.organization_name}
                                  </>
                                )}
                              </>
                            ) : (
                              <>
                                <strong>Submitted by NHS Student:</strong> {suggestion.nhs_user_id}
                                <br />
                                <strong>Contact via:</strong> pmorabito@gvsd.org for student contact information
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </TabsContent>

          {/* Tab: Users Grid */}
          <TabsContent value="users" className="space-y-6">
            <AdminUsersGrid
              onChangePin={handleChangePin}
              onResetNhsId={handleResetNhsId}
              onDeleteUser={handleDeleteUserFromGrid}
            />
          </TabsContent>

          {/* Tab: Organizations & Events */}
          <TabsContent value="organizations" className="space-y-6">
            <AdminOrganizationManager />
          </TabsContent>

          {/* Tab: Announcements */}
          <TabsContent value="announcements" className="space-y-6">
            <AdminAnnouncementManager />
          </TabsContent>

          {/* Tab: Elementary */}
          <TabsContent value="elementary" className="space-y-6">
            <NHSElementaryVisits />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
