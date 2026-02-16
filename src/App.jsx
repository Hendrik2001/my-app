import React, { useState, useEffect, useMemo } from 'react';
import { Toaster, toast } from 'sonner';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, onSnapshot, collection, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase/firebase.js';
import gameData from './constants/gameData.js';
import { LoadingSpinner } from './components/LoadingSpinner.jsx';
import LoginScreen from './features/Login/LoginScreen.jsx';
import { FirmSetup } from './features/Setup/FirmSetup.jsx';
import { TeamDashboard } from './features/Dashboard/TeamDashboard.jsx';
import { AdminDashboard } from './features/Admin/AdminDashboard.jsx';
import { CentralDashboard } from './features/Central/CentralDashboard.jsx';

export default function App() {
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
    const teamPath = useMemo(() => teamId ? `${gamePath}/teams/${teamId}` : null, [gamePath, teamId]);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (authUser) => {
            if (authUser) {
                setUser(authUser);
                const snap = await getDoc(doc(db, "users", authUser.uid));
                setUserData(snap.exists() ? snap.data() : { role: 'anon' });
            } else {
                setUser(null); setUserData(null);
                /* global __initial_auth_token */
                const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                try { token ? await signInWithCustomToken(auth, token) : await signInAnonymously(auth); }
                catch (e) { toast.error(`Sign-in failed: ${e.message}`); }
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (!user || !gamePath || !userData || userData.role === 'anon') { setLoading(userData === null); return; }
        setLoading(true);
        const listeners = [];
        listeners.push(onSnapshot(doc(db, gamePath), s => setGameState(s.exists() ? s.data() : null), e => toast.error(e.message)));
        listeners.push(onSnapshot(collection(db, `${gamePath}/projects`), s => setProjects(s.docs.map(d => ({ id: d.id, ...d.data() }))), e => toast.error(e.message)));
        if (userData?.role === 'admin' || userData?.role === 'central') {
            listeners.push(onSnapshot(collection(db, `${gamePath}/teams`), s => setAllTeams(s.docs.map(d => ({ id: d.id, ...d.data() }))), e => toast.error(e.message)));
        }
        if (userData?.role === 'team' && teamPath) {
            listeners.push(onSnapshot(doc(db, teamPath), s => setTeamData(s.exists() ? s.data() : null), e => toast.error(e.message)));
            listeners.push(onSnapshot(collection(db, `${teamPath}/logs`), s => {
                const d = s.docs.map(d => ({ id: d.id, ...d.data() }));
                d.sort((a, b) => (b.round || 0) - (a.round || 0));
                setLogs(d);
            }, e => toast.error(e.message)));
        }
        setLoading(false);
        return () => listeners.forEach(u => u());
    }, [user, userData, gamePath, teamPath]);

    const handleLogin = async (email, password) => {
        try { await signInWithEmailAndPassword(auth, email, password); toast.success("Login successful."); }
        catch (e) { toast.error(`Login failed: ${e.message}`); throw e; }
    };
    const handleSignup = async (email, password, teamName) => {
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, 'users', cred.user.uid), { email, teamName, role: 'team', teamId: cred.user.uid });
            await setDoc(doc(db, gamePath, 'teams', cred.user.uid), { teamName, money: 0, needsSetup: true });
            toast.success("Firm created.");
        } catch (e) { toast.error(`Signup failed: ${e.message}`); throw e; }
    };
    const handleSetView = async (view) => {
        try {
            if (view === 'admin') await signInWithEmailAndPassword(auth, 'admin@game.com', 'admin100');
            else if (view === 'central') await signInWithEmailAndPassword(auth, 'central@game.com', 'central100');
        } catch (e) { toast.error(`Could not log in as ${view}: ${e.message}`); }
    };

    if (loading || !userData) return <LoadingSpinner />;
    if (userData.role === 'anon') return (<><Toaster position="bottom-right" richColors /><LoginScreen onLogin={handleLogin} onSignup={handleSignup} onSetView={handleSetView} /></>);

    const { role } = userData;
    const currentProjects = projects.filter(p => {
        if (p.rounds && Array.isArray(p.rounds)) return p.rounds.includes(gameState?.currentRound);
        return p.round === gameState?.currentRound;
    });

    return (
        <>
            <Toaster position="bottom-right" richColors />
            {role === 'admin' && <AdminDashboard gamePath={gamePath} gameState={gameState} allTeams={allTeams} projects={projects} />}
            {role === 'central' && <CentralDashboard gameState={gameState} allTeams={allTeams} />}
            {role === 'team' && (
                (!teamData || teamData.needsSetup)
                    ? <FirmSetup teamId={teamId} teamName={userData.teamName} gamePath={gamePath} />
                    : <TeamDashboard teamPath={teamPath} teamId={teamId} teamData={teamData} gameState={gameState} projects={currentProjects} logs={logs} />
            )}
            {(!role || role === 'guest') && <LoginScreen onLogin={handleLogin} onSignup={handleSignup} onSetView={handleSetView} />}
        </>
    );
}
