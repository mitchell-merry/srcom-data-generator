import fetch from 'node-fetch';
import { Run, RunsParams, RunsResponse, GameLevelsResponse, GameCategoriesResponse, GameLevelsParams, GameCategoriesParams, LevelCategoriesResponse, LevelCategoriesParams } from 'srcom-rest-api';

const BASE_URL = "https://www.speedrun.com/api/v1";

// export async function fetchAllCategories()

export async function fetchAllLevelRuns(gameId: string, categoryId: string, levelId: string | undefined, options: RunsParams = {}, variables: [string, string][] = []): Promise<Run[]> {
    return fetchAllRuns(gameId, categoryId, { ...options, level: levelId }, variables);
}

export async function fetchAllRuns(gameId: string, categoryId: string, options: RunsParams = {}, variables: [string, string][] = []): Promise<Run[]> {
    let paramaters: RunsParams = {
        ...options,
        game: gameId,
        category: categoryId
    };

    let res = await get<RunsResponse>(`${BASE_URL}/runs`, paramaters);
    let runs: Run[] = res.data;
    let next: string | undefined;

    while(next = res.pagination.links.find(link => link.rel === 'next')?.uri) {
        res = await get<RunsResponse>(next);

        runs = [...runs, ...res.data];
    }

    return runs.filter(run => {
        return !variables.some(([variableId, valueId]) => run.values[variableId] !== valueId);
    });;
}

export async function fetchAllLevels(gameId: string, options: GameLevelsParams = {}) {
    return get<GameLevelsResponse>(`${BASE_URL}/games/${gameId}/levels`, options).then(r => r.data);
}

export async function fetchAllFullGameCategories(gameId: string, options: GameCategoriesParams = {}) {
    return fetchAllGameCategories(gameId, options).then(res => res.filter(category => category.type === 'per-game'));
}

export async function fetchAllGameCategories(gameId: string, options: GameCategoriesParams = {}) {
    return get<GameCategoriesResponse>(`${BASE_URL}/games/${gameId}/categories`, options).then(r => r.data);
}

export async function fetchAllLevelCategories(levelId: string, options: LevelCategoriesParams = {}) {
    return get<LevelCategoriesResponse>(`${BASE_URL}/levels/${levelId}/categories`, options).then(r => r.data);
}

async function get<ResponseType>(baseURL: string, options: Record<string, any> = {}): Promise<ResponseType> {
    let url = baseURL;
    
    if(Object.entries(options).length != 0) {
        url += `?${Object.entries(options).map(([k, v]) => `${k}=${v}`).join('&')}`;
    }

    return fetch(url).then(res => res.json()) as Promise<ResponseType>;
}
