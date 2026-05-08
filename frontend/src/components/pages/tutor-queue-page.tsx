"use client";

import React, { useState, useEffect } from "react";

interface CheckedInUser {
  user_id: string;
  checked_in_at: string;
  username?: string;
  users?: {
    first_name: string;
    last_name: string;
    highlighted_subjects?: string[];
  } | null;
}

interface UserSubjects {
  [userId: string]: string[];
}

export function TutorQueuePage() {
  const [currentCount, setCurrentCount] = useState(0);
  const [activeUsers, setActiveUsers] = useState<CheckedInUser[]>([]);
  const [userHighlightedSubjects, setUserHighlightedSubjects] = useState<UserSubjects>({});
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [countResponse, usersResponse] = await Promise.all([
        fetch("/api/checkin/count"),
        fetch("/api/checkin/active")
      ]);

      if (countResponse.ok) {
        const countData = await countResponse.json();
        setCurrentCount(countData.count);
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setActiveUsers(usersData);

        // Fetch highlighted subjects for each active user
        const subjectsPromises = usersData.map(async (user: CheckedInUser) => {
          try {
            const response = await fetch(`/api/users/tutoring-subjects?userId=${user.user_id}`);
            if (response.ok) {
              const data = await response.json();
              return {
                userId: user.user_id,
                highlightedSubjects: data.highlightedSubjects || []
              };
            }
          } catch (error) {
            console.error(`Error fetching subjects for user ${user.user_id}:`, error);
          }
          return { userId: user.user_id, highlightedSubjects: [] };
        });

        const subjectsResults = await Promise.all(subjectsPromises);
        const subjectsMap: UserSubjects = {};
        subjectsResults.forEach(result => {
          if (result) {
            subjectsMap[result.userId] = result.highlightedSubjects;
          }
        });
        setUserHighlightedSubjects(subjectsMap);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: 'calc(100vh - 4rem)', padding: '2rem', backgroundColor: '#f8fafc' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '2rem'
        }}>
          <h1 style={{
            textAlign: 'center',
            color: '#2563eb',
            fontSize: '2rem',
            marginBottom: '1rem',
            fontWeight: 'bold'
          }}>
            Library Status
          </h1>

          {/* Current Count */}
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            backgroundColor: '#2563eb',
            borderRadius: '8px',
            color: 'white',
            marginBottom: '1rem'
          }}>
            <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{currentCount}</div>
            <div style={{ fontSize: '1.2rem' }}>Students in Library</div>
          </div>

          {/* Refresh Button */}
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <button
              onClick={fetchData}
              disabled={loading}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem'
              }}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Names List */}
          {(activeUsers.length > 0 || currentCount > 0) && (
            <div style={{
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              padding: '1rem',
              backgroundColor: '#f9fafb'
            }}>
              <h3 style={{
                color: '#374151',
                fontSize: '1.2rem',
                marginBottom: '1rem',
                fontWeight: 'bold'
              }}>
                Current Students:
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {activeUsers.length === 0 && currentCount > 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '1rem',
                    color: '#6b7280',
                    fontStyle: 'italic'
                  }}>
                    Loading student details... ({currentCount} students checked in)
                  </div>
                )}
                {activeUsers.map((user, index) => {
                  const highlightedSubjects = userHighlightedSubjects[user.user_id] || [];
                  // Properly format names with proper casing, with fallback to username
                  const rawFirst = user.users?.first_name || user.username?.split(' ')[0] || 'Unknown';
                  const rawLast = user.users?.last_name || user.username?.split(' ').slice(1).join(' ') || '';
                  const firstName = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase();
                  const lastName = rawLast ? rawLast.charAt(0).toUpperCase() + rawLast.slice(1).toLowerCase() : '';

                  return (
                    <div
                      key={user.user_id}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        textAlign: 'center',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      <div style={{
                        fontWeight: 'bold',
                        color: '#1f2937',
                        fontSize: '1rem',
                        marginBottom: '4px'
                      }}>
                        {index + 1}. {firstName} {lastName}
                      </div>
                      {highlightedSubjects.length > 0 && (
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '4px',
                          marginTop: '6px',
                          justifyContent: 'center'
                        }}>
                          {highlightedSubjects.map((subject, subIndex) => (
                            <span
                              key={subIndex}
                              style={{
                                fontSize: '11px',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                backgroundColor: '#fef3c7',
                                color: '#92400e',
                                border: '1px solid #fbbf24',
                                fontWeight: '500',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}
                            >
                              ⭐ {subject}
                            </span>
                          ))}
                        </div>
                      )}
                      {highlightedSubjects.length === 0 && (
                        <div style={{
                          fontSize: '11px',
                          color: '#6b7280',
                          fontStyle: 'italic',
                          marginTop: '4px'
                        }}>
                          No highlighted subjects
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {currentCount === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: '#6b7280',
                marginBottom: '0.5rem'
              }}>
                No students in library
              </h3>
              <p style={{ color: '#9ca3af' }}>
                Students will appear here when they check in.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}