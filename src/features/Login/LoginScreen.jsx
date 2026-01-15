import React, { useState } from 'react';
import { Briefcase, Eye, Settings } from 'lucide-react';

const LoginScreen = ({ onLogin, onSignup, onSetView }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [teamName, setTeamName] = useState('');
    const [isSignup, setIsSignup] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            if (isSignup) {
                if (!teamName) {
                    setError("Please enter a Team Name to sign up.");
                    return;
                }
                await onSignup(email, password, teamName);
            } else {
                await onLogin(email, password);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 bg-evergreen overflow-hidden">
            {/* Upper background with decorative curve */}
            <div className="absolute top-0 left-0 right-0 h-[50vh] bg-slate-muted rounded-b-[50%] scale-x-150 transform origin-top pointer-events-none"></div>

            <div className="relative z-10 max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
                <div className="flex flex-col items-center justify-center mb-6">
                    <Briefcase size={48} className="text-evergreen mb-3" />
                    <h1 className="text-2xl font-bold text-evergreen text-center">The Value Collective</h1>
                </div>

                <h2 className="text-xl font-semibold text-center text-gray-700 mb-2">
                    {isSignup ? "Create Your Firm" : "Firm Login"}
                </h2>
                <p className="text-center text-slate-muted mb-6">Welcome to the simulation</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignup && (
                        <input
                            type="text"
                            placeholder="Your Team Name"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-evergreen focus:border-transparent transition-all"
                            required
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Email (e.g., team1@game.com)"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-evergreen focus:border-transparent transition-all"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-evergreen focus:border-transparent transition-all"
                        required
                    />

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <button
                        type="submit"
                        className="w-full bg-evergreen text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-evergreen transition duration-150 ease-in-out"
                    >
                        {isSignup ? "Sign Up & Create Firm" : "Login"}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <button
                        onClick={() => setIsSignup(!isSignup)}
                        className="text-sm text-evergreen hover:underline font-medium"
                    >
                        {isSignup ? "Already have a firm? Login" : "Need to create a firm? Sign Up"}
                    </button>
                </div>

                <div className="mt-8 border-t border-slate-200 pt-6 text-center space-y-3">
                    <button
                        onClick={() => onSetView('central')}
                        className="w-full text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 font-medium py-3 px-4 rounded-lg transition flex items-center justify-center"
                    >
                        <Eye size={16} className="mr-2" />
                        View Central Dashboard (Beamer)
                    </button>
                    <button
                        onClick={() => onSetView('admin')}
                        className="w-full text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 font-medium py-3 px-4 rounded-lg transition flex items-center justify-center"
                    >
                        <Settings size={16} className="mr-2" />
                        Admin Login
                    </button>
                </div>
            </div>

            {/* Footer Text on Dark Background */}
            <div className="absolute bottom-4 left-0 right-0 text-center">
                <p className="text-white text-xs opacity-70">
                    &copy; 2026 The Value Collective. All rights reserved.
                </p>
            </div>
        </div>
    );

};

export default LoginScreen;