import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the intended destination from location state, if it exists
  const from = location.state?.from?.pathname || '/dashboard';
  
  // Check if user is already logged in
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User is already authenticated, redirecting to:', from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Helper function to sanitize input
  const sanitizeInput = (input: string): string => {
    // Remove any non-printable characters and normalize whitespace
    return input.trim()
      .replace(/\s+/g, ' ')  // Replace multiple spaces with a single space
      .replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remove zero-width spaces
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      // Sanitize the username and password
      const sanitizedUsername = sanitizeInput(username);
      const sanitizedPassword = sanitizeInput(password);
      
      console.log(`Attempting login with username: "${sanitizedUsername}", password length: ${sanitizedPassword.length}`);
      
      if (!sanitizedUsername || !sanitizedPassword) {
        setError('Username and password are required');
        setIsLoading(false);
        return;
      }
      
      // Add a small delay to help with potential race conditions
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const success = await login(sanitizedUsername, sanitizedPassword);
      
      if (success) {
        console.log('Login successful, redirecting to:', from);
        // Use React Router's navigate instead of direct window location change
        navigate(from, { replace: true });
      } else {
        console.log('Login failed');
        
        // Add helper message for demo credentials
        if (sanitizedUsername.toLowerCase() !== 'admin' && sanitizedUsername.toLowerCase() !== 'user') {
          setError('Invalid username or password. Try "admin" or "user" with password "password"');
        } else {
          setError('Invalid username or password. Check that you entered the credentials correctly.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Auto-fill demo credentials for easier testing
  const fillAdminCredentials = () => {
    setUsername('admin');
    setPassword('password');
    setError(null);
  };
  
  const fillUserCredentials = () => {
    setUsername('user');
    setPassword('password');
    setError(null);
  };
  
  return (
    <div className="max-w-md mx-auto my-12 p-6 bg-gradient-to-br from-slate-800/70 to-slate-900/70 rounded-xl border border-slate-700/50 shadow-lg backdrop-blur-sm">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">Login</h2>
        <p className="text-slate-400 mt-1">Sign in to access platform features</p>
      </div>
      
      {error && (
        <div className="bg-red-900/20 border border-red-800/30 text-red-300 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
            placeholder="Enter your username"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
            placeholder="Enter your password"
            required
          />
        </div>
        
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md shadow-blue-500/20 transition duration-200"
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-sm mr-2"></span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </div>
        
        <div className="text-center mt-4 text-sm text-slate-400">
          <p>For demo purposes:</p>
          <p className="mt-2 text-indigo-300 font-semibold">Admin account:</p>
          <div className="bg-black/20 p-2 rounded mt-1 mb-2">
            <p>Username: <span className="text-blue-400 font-mono cursor-pointer" onClick={fillAdminCredentials}>admin</span></p>
            <p>Password: <span className="text-blue-400 font-mono">password</span></p>
          </div>
          
          <p className="mt-2 text-indigo-300 font-semibold">Regular user:</p>
          <div className="bg-black/20 p-2 rounded mt-1">
            <p>Username: <span className="text-blue-400 font-mono cursor-pointer" onClick={fillUserCredentials}>user</span></p>
            <p>Password: <span className="text-blue-400 font-mono">password</span></p>
          </div>
        </div>
      </form>
    </div>
  );
} 