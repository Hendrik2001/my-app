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
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
                <div className="flex justify-center mb-6">
                    <Briefcase size={48} className="text-indigo-600" />
                </div>
                <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
                    {isSignup ? "Create Your Firm" : "Firm Login"}
                </h2>
                <p className="text-center text-gray-500 mb-6">Welcome to Law Firm Sim</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignup && (
                        <input
                            type="text"
                            placeholder="Your Team Name"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Email (e.g., team1@game.com)"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                    />

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out"
                    >
                        {isSignup ? "Sign Up & Create Firm" : "Login"}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <button
                        onClick={() => setIsSignup(!isSignup)}
                        className="text-sm text-indigo-600 hover:underline"
                    >
                        {isSignup ? "Already have a firm? Login" : "Need to create a firm? Sign Up"}
                    </button>
                </div>

                <div className="mt-8 border-t pt-6 text-center space-y-3">
                    <button
                        onClick={() => onSetView('central')}
                        className="w-full text-sm text-gray-700 bg-gray-200 hover:bg-gray-300 font-medium py-3 px-4 rounded-lg transition"
                    >
                        <Eye size={16} className="inline mr-2" />
                        View Central Dashboard (Beamer)
                    </button>
                    <button
                        onClick={() => onSetView('admin')}
                        className="w-full text-sm text-gray-700 bg-gray-200 hover:bg-gray-300 font-medium py-3 px-4 rounded-lg transition"
                    >
                        <Settings size={16} className="inline mr-2" />
                        Admin Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;