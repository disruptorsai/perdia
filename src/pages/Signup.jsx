import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Smartphone, Mail, Lock, User, Building, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { signUp } from '@/lib/supabase-client';

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    organization: '',
    agreedToTerms: false
  });
  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Name validation
    if (!formData.name || formData.name.trim().length === 0) {
      errors.name = 'Name is required';
    }

    // Terms validation
    if (!formData.agreedToTerms) {
      errors.agreedToTerms = 'You must agree to the terms and conditions';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Create user with Supabase
      const { user, session, error: signupError } = await signUp(
        formData.email,
        formData.password,
        {
          name: formData.name,
          organization: formData.organization || null
        }
      );

      if (signupError) {
        throw signupError;
      }

      // Check if email confirmation is required
      if (!session) {
        // Email confirmation required
        setSuccess(true);
        setError(null);
        return;
      }

      // Successfully signed up and logged in
      console.log('✅ Signup successful:', user?.email);

      // Reset onboarding flags for new user
      localStorage.setItem('perdia_onboarding_completed', 'false');
      localStorage.setItem('perdia_onboarding_current_step', '0');
      localStorage.setItem('perdia_onboarding_skipped', 'false');

      // Redirect to dashboard after brief success message
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);

    } catch (err) {
      console.error('Signup error:', err);

      // Handle specific error messages
      let errorMessage = 'Failed to create account. Please try again.';

      if (err.message?.includes('User already registered')) {
        errorMessage = 'This email is already registered. Please login instead.';
      } else if (err.message?.includes('Password should be')) {
        errorMessage = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.message?.includes('Unable to validate email')) {
        errorMessage = 'Invalid email address. Please check and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#009fde] to-[#0077b5] flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#009fde] to-[#0077b5] rounded-full flex items-center justify-center">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">Create Your Account</CardTitle>
            <p className="text-muted-foreground text-sm mt-2">
              Join Perdia Education - AI-Powered SEO Automation
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {/* Success Message */}
            {success && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Account created successfully! Please check your email to confirm your account.
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  className={`pl-10 ${formErrors.name ? 'border-red-500' : ''}`}
                  disabled={loading}
                  autoComplete="name"
                />
              </div>
              {formErrors.name && (
                <p className="text-sm text-red-500">{formErrors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`pl-10 ${formErrors.email ? 'border-red-500' : ''}`}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              {formErrors.email && (
                <p className="text-sm text-red-500">{formErrors.email}</p>
              )}
            </div>

            {/* Organization Field (Optional) */}
            <div className="space-y-2">
              <label htmlFor="organization" className="text-sm font-medium">
                Organization <span className="text-muted-foreground text-xs">(Optional)</span>
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="organization"
                  name="organization"
                  type="text"
                  placeholder="Your Company Name"
                  value={formData.organization}
                  onChange={handleChange}
                  className="pl-10"
                  disabled={loading}
                  autoComplete="organization"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className={`pl-10 pr-10 ${formErrors.password ? 'border-red-500' : ''}`}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-sm text-red-500">{formErrors.password}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters
              </p>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`pl-10 pr-10 ${formErrors.confirmPassword ? 'border-red-500' : ''}`}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="text-sm text-red-500">{formErrors.confirmPassword}</p>
              )}
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="agreedToTerms"
                name="agreedToTerms"
                checked={formData.agreedToTerms}
                onCheckedChange={(checked) => handleChange({
                  target: { name: 'agreedToTerms', type: 'checkbox', checked }
                })}
                disabled={loading}
                className={formErrors.agreedToTerms ? 'border-red-500' : ''}
              />
              <label
                htmlFor="agreedToTerms"
                className="text-sm text-muted-foreground leading-tight cursor-pointer"
              >
                I agree to the Terms of Service and Privacy Policy
              </label>
            </div>
            {formErrors.agreedToTerms && (
              <p className="text-sm text-red-500 -mt-2">{formErrors.agreedToTerms}</p>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#009fde] to-[#0077b5] hover:from-[#0077b5] hover:to-[#005580]"
              disabled={loading || success}
            >
              {loading ? 'Creating Account...' : success ? 'Account Created!' : 'Create Account'}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-[#009fde] hover:text-[#0077b5] font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="text-center text-xs text-muted-foreground space-y-2">
              <p>
                By creating an account, you'll get access to:
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                  AI Content Generation
                </span>
                <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                  Keyword Manager
                </span>
                <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                  Performance Tracking
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
