import React, { useState, useEffect } from 'react';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';

export function AuthDebug() {
  const [cognitoUser, setCognitoUser] = useState<any>(null);
  const [userAttributes, setUserAttributes] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser();
      setCognitoUser(user);
      
      const attributes = await fetchUserAttributes();
      setUserAttributes(attributes);
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setCognitoUser(null);
      setUserAttributes(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg max-w-md text-white text-sm">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      
      {error && (
        <div className="mb-2 p-2 bg-red-600 rounded text-white">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {cognitoUser && (
        <div className="mb-2">
          <strong>Cognito User:</strong>
          <pre className="text-xs mt-1 bg-gray-700 p-2 rounded overflow-auto">
            {JSON.stringify(cognitoUser, null, 2)}
          </pre>
        </div>
      )}
      
      {userAttributes && (
        <div className="mb-2">
          <strong>User Attributes:</strong>
          <pre className="text-xs mt-1 bg-gray-700 p-2 rounded overflow-auto">
            {JSON.stringify(userAttributes, null, 2)}
          </pre>
        </div>
      )}
      
      <button 
        onClick={checkAuth}
        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs"
      >
        Refresh
      </button>
    </div>
  );
}
