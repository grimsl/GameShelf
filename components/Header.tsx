import { Link } from 'react-router-dom';
import { Gamepad2, User, LogOut, LogIn, UserPlus } from 'lucide-react';

interface HeaderProps {
  user: any;
  signOut: () => void;
}

export function Header({ user, signOut }: HeaderProps) {
  return (
    <header className="bg-gray-900 border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white">
            <Gamepad2 className="w-8 h-8 text-indigo-500" />
            GameShelf
          </Link>

          {/* Navigation & User Menu */}
          <div className="flex items-center gap-4">
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                to="/" 
                className="text-gray-300 hover:text-white transition-colors"
              >
                Home
              </Link>
              {user && (
                <>
                  <Link 
                    to="/profile" 
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Profile
                  </Link>
                  <Link 
                    to="/library" 
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Library
                  </Link>
                </>
              )}
            </nav>

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-4">
                <Link 
                  to="/profile" 
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline">{user?.username || user?.email}</span>
                </Link>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  to="/profile" 
                  className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white transition-colors border border-gray-600 rounded-md hover:border-gray-500"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
                <Link 
                  to="/profile" 
                  className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
