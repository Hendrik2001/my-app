import { ALL_PROJECTS_POOL, GAME_SETTINGS } from '../constants/gameData';

/**
 * Generate projects for a specific round
 * Ensures a mix of simple, medium, and complex projects every round
 */
export function generateProjectsForRound(roundNum) {
    const { PROJECTS_PER_ROUND } = GAME_SETTINGS;

    // Categorize projects by complexity
    const simple = ALL_PROJECTS_POOL.filter(p => p.complexity <= 45);
    const complex = ALL_PROJECTS_POOL.filter(p => p.complexity >= 70);
    const medium = ALL_PROJECTS_POOL.filter(p => p.complexity > 45 && p.complexity < 70);

    // Ensure diversity: 3-5 simple, 3-5 complex, rest medium
    const numSimple = 3 + Math.floor(Math.random() * 3);  // 3-5
    const numComplex = 3 + Math.floor(Math.random() * 3); // 3-5
    const numMedium = PROJECTS_PER_ROUND - numSimple - numComplex;

    const projects = [];

    // Add simple projects
    for (let i = 0; i < numSimple; i++) {
        const template = simple[Math.floor(Math.random() * simple.length)];
        projects.push({
            ...template,
            id: `${roundNum}-${i}`,
            round: roundNum
        });
    }

    // Add complex projects
    for (let i = 0; i < numComplex; i++) {
        const template = complex[Math.floor(Math.random() * complex.length)];
        projects.push({
            ...template,
            id: `${roundNum}-${numSimple + i}`,
            round: roundNum
        });
    }

    // Add medium projects
    for (let i = 0; i < numMedium; i++) {
        const template = medium[Math.floor(Math.random() * medium.length)];
        projects.push({
            ...template,
            id: `${roundNum}-${numSimple + numComplex + i}`,
            round: roundNum
        });
    }

    return projects;
}