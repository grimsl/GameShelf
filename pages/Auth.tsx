import { useState } from 'react';
import { LoginForm } from '../components/LoginForm';
import { RegisterForm } from '../components/RegisterForm';
import { ConfirmationForm } from '../components/ConfirmationForm';

interface AuthProps {
  onAuthSuccess: () => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [confirmationUserHandle, setConfirmationUserHandle] = useState('');

  const handleAuthSuccess = () => {
    onAuthSuccess();
  };

  const handleRegisterSuccess = (email: string, userHandle: string) => {
    setConfirmationEmail(email);
    setConfirmationUserHandle(userHandle);
    setShowConfirmation(true);
  };

  const handleConfirmationSuccess = () => {
    setShowConfirmation(false);
    setIsLogin(true); // Switch to login form after confirmation
  };

  const switchToLogin = () => {
    setIsLogin(true);
    setShowConfirmation(false);
  };

  const switchToRegister = () => {
    setIsLogin(false);
    setShowConfirmation(false);
  };

  const backToRegister = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">GameShelf</h1>
          <p className="text-gray-400">Track your games, showcase your achievements</p>
        </div>

        <div className="card">
          {showConfirmation ? (
            <ConfirmationForm
              email={confirmationEmail}
              userHandle={confirmationUserHandle}
              onSuccess={handleConfirmationSuccess}
              onBack={backToRegister}
            />
          ) : isLogin ? (
            <LoginForm
              onSuccess={handleAuthSuccess}
              onSwitchToRegister={switchToRegister}
            />
          ) : (
            <RegisterForm
              onSuccess={handleRegisterSuccess}
              onSwitchToLogin={switchToLogin}
            />
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
