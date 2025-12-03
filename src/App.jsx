import React, { useState, useEffect, useMemo } from 'react';
import { Toaster, toast } from 'sonner';
import {
    onAuthStateChanged,
    signInAnonymously,
    signInWithCustomToken,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, onSnapshot, collection, getDoc, setDoc } from 'firebase/firestore';

import { auth, db } from './firebase/firebase.js';
import gameData from './constants/gameData.js';

// --- Core Components & Screens ---
import { LoadingSpinner } from './components/LoadingSpinner.jsx';
import  LoginScreen  from './features/Login/LoginScreen.jsx';
import { FirmSetup } from './features/Setup/FirmSetup.jsx';
import { TeamDashboard } from './features/Dashboard/TeamDashboard.jsx';
import { AdminDashboard } from './features/Admin/AdminDashboard.jsx';
import { CentralDashboard } from './features/Central/CentralDashboard.jsx';

// --- Main App Component ---
export default function App() {
    // --- State Management ---
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [gameState, setGameState] = useState(null);
    const [teamData, setTeamData] = useState(null);
    const [allTeams, setAllTeams] = useState([]);
    const [projects, setProjects] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const gameId = "game123"; 
    const gamePath = useMemo(() => `games/${gameId}`, [gameId]);
    
    const teamId = useMemo(() => userData?.teamId, [userData]);
    const teamPath = useMemo(() => {
        if (!teamId) return null;
        return `${gamePath}/teams/${teamId}`;
    }, [gamePath, teamId]);

    // --- 1. Authentication Effect ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            if (authUser) {
                setUser(authUser);
                const userDocRef = doc(db, "users", authUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setUserData(userDocSnap.data());
                } else {
                    setUserData({ role: 'anon' });
                }
            } else {
                setUser(null);
                setUserData(null);
                /* global __initial_auth_token */
                const initialAuthToken = typeof __initial_auth_token !== 'undefined'
                    ? __initial_auth_token
                    : null;
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(auth, initialAuthToken);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (error) {
                    console.error("Error signing in:", error);
                    toast.error(`Sign-in failed: ${error.message}`);
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // --- 2. Real-time Data Listeners Effect ---
    useEffect(() => {
        if (!user || !gamePath || !userData || userData.role === 'anon') {
            setLoading(userData === null);
            return;
        }

        setLoading(true);
        const listeners = [];

        const gameStateRef = doc(db, gamePath);
        listeners.push(onSnapshot(gameStateRef, (docSnap) => {
            if (docSnap.exists()) {
                setGameState(docSnap.data());
            } else {
                setGameState(null); 
            }
        }, (error) => toast.error(`Error loading game: ${error.message}`)));

        const projectsRef = collection(db, `${gamePath}/projects`);
        listeners.push(onSnapshot(projectsRef, (querySnapshot) => {
            setProjects(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => toast.error(`Error loading projects: ${error.message}`)));

        if (userData?.role === 'admin' || userData?.role === 'central') {
            const allTeamsRef = collection(db, `${gamePath}/teams`);
            listeners.push(onSnapshot(allTeamsRef, (querySnapshot) => {
                setAllTeams(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }, (error) => toast.error(`Error loading teams: ${error.message}`)));
        }

        if (userData?.role === 'team' && teamPath) {
            const teamDocRef = doc(db, teamPath);
            listeners.push(onSnapshot(teamDocRef, (docSnap) => {
                if (docSnap.exists()) setTeamData(docSnap.data());
                else setTeamData(null);
            }, (error) => toast.error(`Error loading team data: ${error.message}`)));

            const logsRef = collection(db, `${teamPath}/logs`);
            listeners.push(onSnapshot(logsRef, (querySnapshot) => {
                const logsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                logsData.sort((a, b) => (b.round || 0) - (a.round || 0));
                setLogs(logsData);
            }, (error) => toast.error(`Error loading logs: ${error.message}`)));
        }

        setLoading(false);
        return () => {
            listeners.forEach(unsubscribe => unsubscribe());
        };
    }, [user, userData, gamePath, teamPath]);

    // --- 3. Auth Functions ---
    const handleLogin = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success("Login successful!");
        } catch (error) {
            console.error(error);
            toast.error(`Login failed: ${error.message}`);
            throw error;
        }
    };

    const handleSignup = async (email, password, teamName) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const userDocRef = doc(db, 'users', userCredential.user.uid);
            await setDoc(userDocRef, {
                email: email,
                teamName: teamName,
                role: 'team',
                teamId: userCredential.user.uid
            });

            const teamDocRef = doc(db, gamePath, 'teams', userCredential.user.uid);
            await setDoc(teamDocRef, {
                teamName: teamName,
                money: 0,
                needsSetup: true
            });
            toast.success("Firm created successfully!");
        } catch (error) {
            console.error(error);
            toast.error(`Signup failed: ${error.message}`);
            throw error;
        }
    };

    const handleSetView = async (view) => {
        try {
            if (view === 'admin') {
                await signInWithEmailAndPassword(auth, 'admin@game.com', 'admin100');
            } else if (view === 'central') {
                await signInWithEmailAndPassword(auth, 'central@game.com', 'central100');
            }
        } catch (error)
        {
            console.error(error);
            toast.error(`Could not log in as ${view}: ${error.message}`);
        }
    };

    // --- 4. Render Logic ---
    if (loading || !userData) {
        return <LoadingSpinner />;
    }
    
    if (userData.role === 'anon') {
        return (
            <>
                <Toaster position="bottom-right" richColors />
                <LoginScreen
                    onLogin={handleLogin}
                    onSignup={handleSignup}
                    onSetView={handleSetView}
                />
            </>
        );
    }

    const { role } = userData;
    const currentProjects = projects.filter(p => p.round === gameState?.currentRound);

    return (
        <>
            <Toaster position="bottom-right" richColors />
            
            {role === 'admin' && (
                <AdminDashboard 
                    gamePath={gamePath} // We pass gamePath here
                    gameState={gameState}
                    allTeams={allTeams}
                    projects={projects}
                />
            )}
            
            {role === 'central' && (
                <CentralDashboard 
                    gameState={gameState} 
                    allTeams={allTeams} 
                />
            )}

            {role === 'team' && (
                <>
                    {(!teamData || teamData.needsSetup) ? (
                        <FirmSetup 
                            teamId={teamId}
                            teamName={userData.teamName}
                            gamePath={gamePath}
                        />
                    ) : (
                        <TeamDashboard 
                            teamPath={teamPath}
                            teamData={teamData}
                            gameState={gameState}
                            projects={currentProjects}
                            logs={logs}
                        />
                    )}
                </>
            )}
            
            {(!role || role === 'guest') && (
                <LoginScreen 
                    onLogin={handleLogin}
                    onSignup={handleSignup}
                    onSetView={handleSetView}
                />
            )}
        </>
    );
}