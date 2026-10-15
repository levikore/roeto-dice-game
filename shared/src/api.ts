import type { GameEvent, GameView } from './game';

export interface UserDto {
  id: string;
  username: string;
  wins: number;
}

export interface AuthResponse {
  token: string;
  user: UserDto;
}

export interface GameResponse {
  game: GameView;
}

/** Roll and hold also report what just happened, so the UI can show it. */
export interface ActionResponse extends GameResponse {
  events: GameEvent[];
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  wins: number;
  isBot: boolean;
}

export interface ApiErrorBody {
  error: { code: string; message: string };
}
