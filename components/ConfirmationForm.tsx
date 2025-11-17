import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { authService } from '../services/authService';

interface ConfirmationFormProps {
  email: string;
  userHandle: string;
  onSuccess: () => void;
  onBack: () => void;
}

export function ConfirmationForm({ email, userHandle, onSuccess, onBack }: ConfirmationFormProps) {
  const [confirmationCode, setConfirmationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confirmationCode) {
      toast.error('Please enter the confirmation code');
      return;
    }

    setLoading(true);
    try {
      await authService.confirmSignUp(email, confirmationCode, userHandle);
      toast.success('Email confirmed successfully! Please sign in with your credentials.');
      onSuccess();
    } catch (error) {
      console.error('Confirmation error:', error);
      toast.error(error instanceof Error ? error.message : 'Confirmation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    try {
      await authService.resendConfirmationCode(email);
      toast.success('Confirmation code sent!');
    } catch (error) {
      console.error('Resend error:', error);
      toast.error('Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Confirm Your Email
        </h2>
        
        <p className="text-gray-300 mb-6 text-center">
          We've sent a confirmation code to <strong>{email}</strong>. 
          Please enter the code below to verify your account.
        </p>
        
        <p className="text-gray-400 mb-4 text-center text-sm">
          After confirmation, you'll need to sign in with your email and password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="confirmationCode" className="block text-sm font-medium text-gray-300 mb-2">
              Confirmation Code
            </label>
            <input
              type="text"
              id="confirmationCode"
              name="confirmationCode"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter 6-digit code"
              maxLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Confirming...' : 'Confirm Email'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={handleResendCode}
            disabled={resending}
            className="text-blue-400 hover:text-blue-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending ? 'Sending...' : "Didn't receive the code? Resend"}
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-gray-300 text-sm"
          >
            ← Back to Registration
          </button>
        </div>
      </div>
    </div>
  );
}
