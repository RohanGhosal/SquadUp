'use client';

import { useState, useEffect, useRef } from 'react';
import { socket } from '@/lib/socket';

type Message = {
    user: string;
    message: string;
    time: string;
};

type Lobby = {
    _id: string;
    host: string;
    game: string;
};

export default function LobbyRoom({ lobby, onClose }: { lobby: Lobby, onClose: () => void }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Mock User for V3
    const currentUser = "You";

    useEffect(() => {
        // Join the room
        socket.emit('join_lobby', lobby._id);

        const onReceiveMessage = (data: Message) => {
            setMessages((prev) => [...prev, data]);
        };

        socket.on('receive_message', onReceiveMessage);

        return () => {
            socket.off('receive_message', onReceiveMessage);
        };
    }, [lobby._id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentMessage.trim() === '') return;

        const msgData = {
            lobbyId: lobby._id,
            user: currentUser,
            message: currentMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        socket.emit('send_message', msgData);
        // Optimistic update handled by receive_message usually, but since we emit to all in room including sender (io.to vs socket.to), we wait for server echo or just display it.
        // Server implementation sends to "io.to" which includes sender. So we don't need to manually add it here if we trust the server roundtrip. 
        // However, for snappy feel, we can add it, but then we duplicate if server echoes. 
        // My server code: io.to(data.lobbyId).emit... -> This includes sender. So I will NOT add it manually here.

        setCurrentMessage('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl relative overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                            {lobby.game} Squad
                        </h2>
                        <p className="text-sm text-slate-400">Host: {lobby.host}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white px-3 py-1 bg-slate-800 rounded-lg text-sm font-medium">
                        Leave Lobby
                    </button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/30">
                    <div className="text-center text-xs text-slate-500 my-4">
                        <span className="bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                            You joined the lobby
                        </span>
                    </div>

                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.user === currentUser ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${msg.user === currentUser
                                    ? 'bg-violet-600 text-white rounded-tr-none'
                                    : 'bg-slate-800 text-slate-200 rounded-tl-none'
                                }`}>
                                <p className="text-sm">{msg.message}</p>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 px-1">
                                {msg.user === currentUser ? 'You' : msg.user} • {msg.time}
                            </span>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={sendMessage} className="p-4 bg-slate-900 border-t border-slate-800">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={currentMessage}
                            onChange={(e) => setCurrentMessage(e.target.value)}
                            placeholder="Message squad..."
                            className="flex-1 bg-slate-800 border-none rounded-xl px-4 text-slate-100 focus:ring-2 focus:ring-violet-500"
                        />
                        <button
                            type="submit"
                            className="bg-violet-600 hover:bg-violet-500 text-white p-3 rounded-xl transition-colors font-bold"
                        >
                            ➤
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
