import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, UserPlus, User, Mail, Key, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const [formData, setFormData] = useState({
    userId: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const { register, error, isLoading, clearError } = useAuth();

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);


  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'userId') {
      // Only allow digits and limit to 6 characters
      const numericValue = value.replace(/\D/g, '').slice(0, 6);
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Validation
    if (formData.userId.length !== 6) {
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      return;
    }

    const registerData = {
      userId: formData.userId,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim() || undefined,
      password: formData.password.trim(),
    };

    const success = await register(registerData);
    if (success) {
      onClose();
      // Reset form
      setFormData({
        userId: '',
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
    }
  };

  const handleClose = () => {
    onClose();
    clearError();
    setFormData({
      userId: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
  };

  const passwordsMatch = formData.password === formData.confirmPassword;
  const validEmail = formData.email.trim().endsWith('@gvsd.org');
  const isFormValid =
    formData.userId.length === 6 &&
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    validEmail &&
    formData.password.length >= 6 &&
    passwordsMatch;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-royal-blue" />
              Join NHS Portal
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* NHS User ID */}
            <div className="space-y-1">
              <Label htmlFor="userId">Choose Your 6-Digit NHS User PIN *</Label>
              <div className="relative">
                <Input
                  id="userId"
                  name="userId"
                  type="text"
                  value={formData.userId}
                  onChange={handleChange}
                  placeholder="123456"
                  className="pl-10 tracking-wider font-mono"
                  maxLength={6}
                  required
                />
                <div className="absolute left-3 top-3">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Create a 6-digit PIN you&apos;ll remember
              </p>
              {formData.userId && formData.userId.length !== 6 && (
                <p className="text-xs text-amber-600">PIN must be exactly 6 digits</p>
              )}
            </div>

            {/* First Name */}
            <div className="space-y-1">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                required
              />
            </div>

            {/* Last Name */}
            <div className="space-y-1">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                required
              />
            </div>

            {/* School Email */}
            <div className="space-y-1">
              <Label htmlFor="email">School Email *</Label>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jdoe26@gvsd.org"
                  className="pl-10"
                  required
                />
                <div className="absolute left-3 top-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500">Must be your @gvsd.org email</p>
            </div>

            {/* Password Fields */}
            <div className="space-y-1">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  className="pl-10"
                  minLength={6}
                  required
                />
                <div className="absolute left-3 top-3">
                  <Key className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className="pl-10"
                  required
                />
                <div className="absolute left-3 top-3">
                  <Key className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              {formData.confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-600">Passwords do not match</p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="text-center pt-2 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Button
                variant="ghost"
                size="sm"
                onClick={onSwitchToLogin}
                className="text-royal-blue p-0 h-auto font-semibold"
              >
                Login here
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}