'use client';

import { useState, useEffect } from 'react';
import { socket } from '@/lib/socket';
import LobbyRoom from '@/components/LobbyRoom';
import { aiManager } from '@/lib/ai';
import { useUser, UserButton, SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';

type Lobby = {
  _id: string;
  host: string;
  game: string;
  map: string;
  mode: string;
  rank: string;
  gender: string;
  mic: boolean;
  postedAt?: string;
  createdAt: string;
  discordLink?: string;
};

export default function Home() {
  const { user, isLoaded } = useUser();
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [activeLobby, setActiveLobby] = useState<Lobby | null>(null);

  // [NEW] AI State
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  useEffect(() => {
    // ===== INITIAL FETCH =====
    fetch('http://localhost:4000/lobbies')
      .then(res => res.json())
      .then(data => {
        console.log('API RESPONSE:', data);

        if (Array.isArray(data)) {
          setLobbies(data);
          setError(null);
        } else if (Array.isArray(data.lobbies)) {
          setLobbies(data.lobbies);
          setError(null);
        } else {
          console.error('Expected array of lobbies, got:', data);
          setLobbies([]);
          setError(data?.error || 'Invalid response from server');
        }

        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch lobbies:', err);
        setLobbies([]);
        setError('Failed to connect to server');
        setIsLoading(false);
      });

    // ===== SOCKET SETUP =====
    if (!socket.connected) {
      socket.connect();
    }

    const onConnect = () => {
      setIsConnected(true);
      console.log('Connected to Socket.IO');
    };

    const onDisconnect = () => {
      setIsConnected(false);
      console.log('Disconnected from Socket.IO');
    };

    const onLobbyCreated = (newLobby: Lobby) => {
      console.log('New Lobby Created:', newLobby);
      setLobbies(prev => [newLobby, ...prev]);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('lobby_created', onLobbyCreated);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('lobby_created', onLobbyCreated);
    };
  }, []);

  // [NEW] Neural Matchmaker Logic
  const handleNeuralSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsAiProcessing(true);
    setAiMessage("Neural Core: Analyzing semantics...");

    try {
      const queryEmbedding = await aiManager.getEmbeddings(searchQuery);

      const scoredLobbies = await Promise.all(lobbies.map(async (lobby) => {
        const lobbyText = `${lobby.game} ${lobby.mode} ${lobby.map} ${lobby.rank} ${lobby.host} ${lobby.gender}`;
        const lobbyEmbedding = await aiManager.getEmbeddings(lobbyText);

        const score = aiManager.cosineSimilarity(queryEmbedding, lobbyEmbedding);
        return { ...lobby, score };
      }));

      // @ts-ignore
      scoredLobbies.sort((a, b) => b.score - a.score);

      setLobbies(scoredLobbies);
      // @ts-ignore
      setAiMessage(`Neural Core: Found ${scoredLobbies.length} matches. Top result: ${(scoredLobbies[0].score * 100).toFixed(1)}%`);
      setTimeout(() => setAiMessage(null), 3000);

    } catch (err) {
      console.error("AI Error:", err);
      setAiMessage("Neural Core: System Overload");
    } finally {
      setIsAiProcessing(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-slate-950 text-slate-100">
      {/* HEADER */}
      <header className="flex justify-between items-center mb-12 max-w-6xl mx-auto">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
            SquadUp
          </h1>
          <p className="text-slate-400 mt-1">
            DEPLOY. DOMINATE. TOGETHER.
            {isConnected && (
              <span className="ml-2 inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse" title="Live Updates Active"></span>
            )}
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-full font-semibold transition-all shadow-lg shadow-violet-500/20">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-full font-semibold transition-all shadow-lg shadow-violet-500/20"
            >
              + Create Squad
            </button>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-10 w-10 border-2 border-violet-500"
                }
              }}
            />
          </SignedIn>
        </div>
      </header>

      {/* AI ALERT */}
      {aiMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-violet-600/90 text-white px-6 py-2 rounded-full shadow-lg backdrop-blur-md animate-bounce">
          {aiMessage}
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="max-w-6xl mx-auto mb-8 bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-red-500/10 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <div>
            <p className="font-bold">System Failure</p>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* FILTERS PANEL */}
        <aside className="lg:col-span-1 hidden lg:block">
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm sticky top-8">
            <h3 className="text-lg font-bold mb-4 text-violet-300">Filters</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Target Game</label>
                <select className="w-full bg-slate-800 border-none rounded-lg p-2 text-sm focus:ring-2 focus:ring-violet-500 text-slate-200">
                  <option>Valorant</option>
                  <option>Apex Legends</option>
                  <option>League of Legends</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Game Mode</label>
                <select className="w-full bg-slate-800 border-none rounded-lg p-2 text-sm focus:ring-2 focus:ring-violet-500 text-slate-200">
                  <option>Any </option>
                  <option>Competitive</option>
                  <option>Casual</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Composition</label>
                <select className="w-full bg-slate-800 border-none rounded-lg p-2 text-sm focus:ring-2 focus:ring-violet-500 text-slate-200">
                  <option>Any</option>
                  <option>Female Only</option>
                  <option>Non-Binary</option>
                </select>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN BOARD */}
        <section className="lg:col-span-3">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Active Protocols</h2>

            {/* NEURAL SEARCH BAR */}
            <div className="flex-1 max-w-md mx-6 relative">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNeuralSearch()}
                placeholder="Ask Neural Core (e.g. 'Chill valo game')"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-4 pr-10 focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all placeholder:text-slate-600"
              />
              <button
                onClick={handleNeuralSearch}
                disabled={isAiProcessing}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-400 disabled:opacity-50"
              >
                {isAiProcessing ? (
                  <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                  </svg>
                )}
              </button>
            </div>

            <button
              onClick={() => {
                setIsLoading(true);
                fetch('http://localhost:4000/lobbies')
                  .then(res => res.json())
                  .then(data => {
                    console.log('REFRESH RESPONSE:', data);
                    if (Array.isArray(data)) {
                      setLobbies(data);
                    } else if (Array.isArray(data.lobbies)) {
                      setLobbies(data.lobbies);
                    } else {
                      console.error('Expected array of lobbies, got:', data);
                      setLobbies([]);
                    }
                    setIsLoading(false);
                  })
                  .catch(err => {
                    console.error(err);
                    setIsLoading(false);
                  });
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-all text-sm border border-slate-700"
            >
              ↻ Refresh Data
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-20 text-slate-500">Establishing Uplink...</div>
          ) : (
            <div className="space-y-4">
              {lobbies.map(lobby => (
                <div
                  key={lobby._id}
                  className="bg-slate-900 border border-slate-800 hover:border-violet-500/50 rounded-xl p-5 transition-all hover:bg-slate-800/80 group"
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-slate-100">{lobby.map}</h3>
                        <span className="bg-slate-800 text-xs text-slate-300 px-2 py-1 rounded border border-slate-700 font-mono">
                          {lobby.game}
                        </span>
                        {/* @ts-ignore */}
                        {lobby.score !== undefined && (
                          <span className="text-xs text-pink-400 font-mono flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 mr-1">
                              <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
                            </svg>
                            Match: {((lobby as any).score * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="text-violet-300">{lobby.mode}</span>
                        <span>•</span>
                        <span>{lobby.rank}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs text-slate-500">HOST</div>
                        <div className="text-sm font-semibold text-slate-300">{lobby.host}</div>
                      </div>
                      <button
                        onClick={() => setActiveLobby(lobby)}
                        className="px-5 py-2 bg-slate-700 hover:bg-violet-600 text-white rounded-lg font-medium transition-colors text-sm"
                      >
                        Join Squad
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {lobbies.length === 0 && (
                <div className="text-center py-10 text-slate-600 border border-dashed border-slate-800 rounded-xl">
                  <p className="text-lg">No Signals Detected</p>
                  <p className="text-sm">Be the first to create a squad.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
              Initialize Squad
            </h2>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsAiProcessing(true);
              setAiMessage("Neural Core: Validating protocol...");

              const formData = new FormData(e.target as HTMLFormElement);
              const data = Object.fromEntries(formData);
              const hostname = user?.fullName || user?.firstName || 'Unknown Commander';

              // [NEW] Toxicity Check
              const textToCheck = `${data.game} ${data.map} ${data.mode} ${hostname}`;
              try {
                const sentiment = await aiManager.classifyToxicity(textToCheck);
                // @ts-ignore
                console.log("AI Verdict:", sentiment);
                // @ts-ignore
                if (sentiment.label === 'NEGATIVE' && sentiment.score > 0.9) {
                  setAiMessage("⚠️ TOXICITY DETECTED ⚠️ Deployment Aborted.");
                  setTimeout(() => setAiMessage(null), 3000);
                  setIsAiProcessing(false);
                  return; // STOP!
                }
              } catch (err) {
                console.error("AI Check Failed, proceeding anyway", err);
              }

              setAiMessage("Neural Core: Verified. Deploying.");

              fetch('http://localhost:4000/lobbies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...data,
                  host: hostname,
                  mic: true
                })
              }).then(() => {
                setIsModalOpen(false);
                setAiMessage(null);
                setIsAiProcessing(false);
              });
            }} className="space-y-4">

              <div>
                <label className="block text-sm text-slate-400 mb-1">Select Game</label>
                <select name="game" className="w-full bg-slate-800 border-none rounded-lg p-2.5 text-slate-100 focus:ring-2 focus:ring-violet-500">
                  <option>Valorant</option>
                  <option>Apex Legends</option>
                  <option>League of Legends</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Map / Zone</label>
                  <input name="map" required placeholder="Ascent" className="w-full bg-slate-800 border-none rounded-lg p-2.5 text-slate-100 focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Mode</label>
                  <input name="mode" required placeholder="Ranked" className="w-full bg-slate-800 border-none rounded-lg p-2.5 text-slate-100 focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Rank Tier</label>
                  <input name="rank" required placeholder="Gold 2" className="w-full bg-slate-800 border-none rounded-lg p-2.5 text-slate-100 focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Requirements</label>
                  <select name="gender" className="w-full bg-slate-800 border-none rounded-lg p-2.5 text-slate-100 focus:ring-2 focus:ring-violet-500">
                    <option>Any</option>
                    <option>Female Only</option>
                    <option>Non-Binary</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold mt-4 shadow-lg shadow-violet-500/25 transition-all">
                Confirm Deploy
              </button>

            </form>
          </div>
        </div>
      )}

      {activeLobby && (
        <LobbyRoom lobby={activeLobby} onClose={() => setActiveLobby(null)} />
      )}
    </main>
  );
}
