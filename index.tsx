import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';

// --- TYPE DEFINITIONS ---
interface Player {
  name: string;
  score: number;
}
type GameView = 'setup' | 'gameType' | 'level' | 'turn' | 'game' | 'results';
type GameType = 'Perkalian' | 'Penambahan' | 'Pengurangan';

interface Question {
  text: string;
  answer: number;
}

// --- CONSTANTS ---
const LEVEL_RANGES: Record<number, { min: number; max: number; min2?: number; max2?: number }> = {
    1: { min: 1, max: 10 },
    2: { min: 1, max: 20 },
    3: { min: 1, max: 50 },
    4: { min: 10, max: 100, min2: 1, max2: 10 },
    5: { min: 1, max: 100 },
};
const GAME_DURATION = 60;

// --- HELPER FUNCTIONS ---
const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// --- UI COMPONENTS ---

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`card ${className || ''}`}>{children}</div>
);

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className, ...props }) => (
    <button className={`button ${className || ''}`} {...props}>{children}</button>
);

// --- SCREEN COMPONENTS ---

const SetupScreen = ({ onStart }: { onStart: (players: Player[]) => void }) => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [playerName, setPlayerName] = useState('');

    const handleAddPlayer = () => {
        if (playerName.trim() && players.length < 5) {
            setPlayers([...players, { name: playerName.trim(), score: 0 }]);
            setPlayerName('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAddPlayer();
        }
    };

    return (
        <Card>
            <h1>Math Master</h1>
            <p>Masukkan nama pemain (1-5 orang)</p>
            <div className="input-group">
                <input
                    type="text"
                    className="input"
                    placeholder="Nama Pemain"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    maxLength={15}
                />
                <Button onClick={handleAddPlayer} disabled={!playerName.trim() || players.length >= 5}>
                    TAMBAH
                </Button>
            </div>
            {players.length > 0 && (
                <ul className="player-list">
                    {players.map((p, i) => <li key={i} className="player-tag">{p.name}</li>)}
                </ul>
            )}
            <Button onClick={() => onStart(players)} disabled={players.length === 0}>
                MULAI PERMAINAN
            </Button>
        </Card>
    );
};

const GameTypeScreen = ({ onSelect }: { onSelect: (type: GameType) => void }) => (
    <Card>
        <h2>Pilih Jenis Permainan</h2>
        <Button onClick={() => onSelect('Perkalian')}>Perkalian</Button>
        <Button onClick={() => onSelect('Penambahan')}>Penambahan</Button>
        <Button onClick={() => onSelect('Pengurangan')}>Pengurangan</Button>
    </Card>
);

const LevelScreen = ({ onSelect }: { onSelect: (level: number) => void }) => (
    <Card>
        <h2>Pilih Level Kesulitan</h2>
        {Object.keys(LEVEL_RANGES).map(level => (
            <Button key={level} onClick={() => onSelect(Number(level))}>
                Level {level}
            </Button>
        ))}
    </Card>
);

const TurnScreen = ({ playerName, onStart }: { playerName: string; onStart: () => void }) => (
    <Card>
        <h2>Giliran Berikutnya</h2>
        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--secondary-accent)' }}>{playerName}</p>
        <Button onClick={onStart}>MULAI</Button>
    </Card>
);

const GameScreen = ({ player, gameType, level, onEndTurn }: {
    player: Player;
    gameType: GameType;
    level: number;
    onEndTurn: (score: number) => void;
}) => {
    const [question, setQuestion] = useState<Question | null>(null);
    const [answer, setAnswer] = useState('');
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [isTimerActive, setIsTimerActive] = useState(false);

    const generateQuestion = useCallback(() => {
        const range = LEVEL_RANGES[level];
        let num1 = getRandomInt(range.min, range.max);
        let num2 = getRandomInt(range.min2 || range.min, range.max2 || range.max);
        let text = '';
        let result = 0;

        switch (gameType) {
            case 'Penambahan':
                text = `${num1} + ${num2}`;
                result = num1 + num2;
                break;
            case 'Pengurangan':
                if (num1 < num2) [num1, num2] = [num2, num1];
                text = `${num1} - ${num2}`;
                result = num1 - num2;
                break;
            case 'Perkalian':
            default:
                text = `${num1} × ${num2}`;
                result = num1 * num2;
                break;
        }
        setQuestion({ text, answer: result });
        setAnswer('');
    }, [gameType, level]);

    useEffect(() => {
        generateQuestion();
    }, [generateQuestion]);

    useEffect(() => {
        if (!isTimerActive || timeLeft <= 0) return;
        const timerId = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timerId);
    }, [isTimerActive, timeLeft]);



    useEffect(() => {
        if (timeLeft === 0) {
            onEndTurn(score);
        }
    }, [timeLeft, score, onEndTurn]);

    const handleAnswerSubmit = () => {
        if (!isTimerActive) {
            setIsTimerActive(true);
        }
        if (parseInt(answer, 10) === question?.answer) {
            setScore(prev => prev + 10);
        }
        generateQuestion();
    };
    
    const handleNumpadClick = (num: string) => {
        if(answer.length < 6) setAnswer(prev => prev + num);
    }
    
    const handleDelete = () => setAnswer(prev => prev.slice(0, -1));

    if (!question) return <Card><h2>Memuat...</h2></Card>;

    return (
        <Card>
            <div className="game-header">
                <div className="player-info">
                    <div className="name">{player.name}</div>
                    <div className="score">Skor: {player.score + score}</div>
                </div>
                <div className="timer">{timeLeft}</div>
            </div>
            <div className="question">{question.text} = ?</div>
            <div className="answer-display">{answer || '...'}</div>
            <div className="numpad">
                {[...Array(9).keys()].map(i => <Button key={i+1} onClick={() => handleNumpadClick(String(i + 1))}>{i + 1}</Button>)}
                <Button className="danger" onClick={handleDelete}>HAPUS</Button>
                <Button onClick={() => handleNumpadClick('0')}>0</Button>
                <Button className="success" onClick={handleAnswerSubmit} disabled={!answer}>JAWAB</Button>
            </div>
        </Card>
    );
};

const ResultsScreen = ({ players, onPlayAgain, onReset }: {
    players: Player[];
    onPlayAgain: () => void;
    onReset: () => void;
}) => {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

    return (
        <Card>
            <h2>Hasil Akhir</h2>
            <ul className="results-list">
                {sortedPlayers.map((p, i) => (
                    <li key={i} className="result-item">
                        <span>{i + 1}. {p.name}</span>
                        <span>{p.score} Poin</span>
                    </li>
                ))}
            </ul>
            <div className="button-grid">
              <Button className="secondary" onClick={onPlayAgain}>MAINKAN ULANG</Button>
              <Button className="danger" onClick={onReset}>RESET</Button>
            </div>
        </Card>
    );
};


// --- MAIN APP COMPONENT ---

const App = () => {
    const [view, setView] = useState<GameView>('setup');
    const [players, setPlayers] = useState<Player[]>([]);
    const [gameType, setGameType] = useState<GameType | null>(null);
    const [level, setLevel] = useState<number | null>(null);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

    const handleStart = (initialPlayers: Player[]) => {
        setPlayers(initialPlayers.map(p => ({...p, score: 0 }))); // Reset scores on new game
        setView('gameType');
    };

    const handleSelectGameType = (type: GameType) => {
        setGameType(type);
        setView('level');
    };

    const handleSelectLevel = (selectedLevel: number) => {
        setLevel(selectedLevel);
        setCurrentPlayerIndex(0);
        setView('turn');
    };

    const handleStartTurn = () => {
        setView('game');
    };

    const handleEndTurn = (turnScore: number) => {
        const updatedPlayers = [...players];
        updatedPlayers[currentPlayerIndex].score += turnScore;
        setPlayers(updatedPlayers);

        if (currentPlayerIndex < players.length - 1) {
            setCurrentPlayerIndex(prev => prev + 1);
            setView('turn');
        } else {
            setView('results');
        }
    };
    
    const handlePlayAgain = () => {
        // Keeps players and scores, starts a new round
        setView('gameType');
        setGameType(null);
        setLevel(null);
        setCurrentPlayerIndex(0);
    };

    const handleReset = () => {
        // Resets everything to the beginning
        setView('setup');
        setPlayers([]);
        setGameType(null);
        setLevel(null);
        setCurrentPlayerIndex(0);
    };

    const renderView = () => {
        switch (view) {
            case 'setup':
                return <SetupScreen onStart={handleStart} />;
            case 'gameType':
                return <GameTypeScreen onSelect={handleSelectGameType} />;
            case 'level':
                return <LevelScreen onSelect={handleSelectLevel} />;
            case 'turn':
                return <TurnScreen playerName={players[currentPlayerIndex].name} onStart={handleStartTurn} />;
            case 'game':
                if (gameType && level !== null) {
                    return <GameScreen
                        player={players[currentPlayerIndex]}
                        gameType={gameType}
                        level={level}
                        onEndTurn={handleEndTurn}
                    />;
                }
                return null;
            case 'results':
                return <ResultsScreen players={players} onPlayAgain={handlePlayAgain} onReset={handleReset} />;
            default:
                return <SetupScreen onStart={handleStart} />;
        }
    };

    return <div className="app-container">{renderView()}</div>;
};

const container = document.getElementById('root');
if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(<App />);
}
