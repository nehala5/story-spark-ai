import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { connectSocket } from "../../socket/socket.oi";
import { isLoggedIn, getUserInfo } from "../../services/auth.service";

interface Participant {
  userId: string;
  username: string;
  color: string;
  socketId: string;
}

interface StoryChunk {
  authorId: string;
  authorName: string;
  color: string;
  text: string;
  isAI: boolean;
  timestamp: Date;
}

interface Room {
  roomId: string;
  createdBy: string;
  participants: Participant[];
  story: StoryChunk[];
  createdAt: Date;
}

export default function CollabRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newText, setNewText] = useState("");
  const user = getUserInfo();
  
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }

    if (!roomId) {
      navigate("/collab");
      return;
    }

    try {
      const socket = connectSocket();
      if (!socket) {
        setError("Connection failed. Please try again later.");
        setLoading(false);
        return;
      }
      socketRef.current = socket;

      // Join the room
      socket.emit("collab:join_room", { roomId, userId: user?.userId, username: user?.name });

      // Request current room state
      socket.emit("collab:get_room", { roomId }, (response: any) => {
        if (response && response.room) {
          setRoom(response.room);
          setError(null);
        } else {
          setError("Room not found or expired.");
        }
        setLoading(false);
      });

      // Listen for updates
      socket.on("collab:room_updated", (data: any) => {
        if (data && data.room) {
          setRoom(data.room);
        }
      });

      socket.on("collab:story_updated", (data: any) => {
        if (data && data.story) {
          setRoom((prev) => (prev ? { ...prev, story: data.story } : null));
        }
      });

      socket.on("collab:error", (data: any) => {
        setError(data.message);
        setLoading(false);
      });

      return () => {
        socket.emit("collab:leave_room", { roomId });
        socket.off("collab:room_updated");
        socket.off("collab:story_updated");
        socket.off("collab:error");
      };
    } catch (err) {
      console.error("Collab Room error:", err);
      setError("Failed to initialize collaboration session.");
      setLoading(false);
    }
  }, [roomId, navigate, user?.userId, user?.name]);

  const handleAddText = () => {
    if (!newText.trim() || !user || !socketRef.current) return;

    socketRef.current.emit("collab:add_text", {
      roomId,
      userId: user.userId,
      text: newText,
    });
    setNewText("");
  };

  const handleAIContinue = () => {
    if (!socketRef.current) return;
    socketRef.current.emit("collab:ai_continue", { roomId });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0d0d14] dark:text-white flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="font-bold tracking-wide uppercase text-xs text-slate-500">Entering Collaborative Space...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0d0d14] dark:text-white flex items-center justify-center px-4 transition-colors duration-300">
        <div className="text-center max-w-md bg-white dark:bg-slate-900 p-10 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-black mb-2">Access Error</h2>
          <p className="text-slate-600 dark:text-white/60 text-sm mb-8 leading-relaxed">{error}</p>
          <button
            onClick={() => navigate("/collab")}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            Return to Collab Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0d0d14] dark:text-white transition-colors duration-300 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/collab")}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-400 hover:text-slate-950 dark:hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <i className="fas fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
            <span className="text-sm font-bold">Leave Room</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Room ID:</span>
            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-full font-mono text-sm font-bold">
              {roomId}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Story Board */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-[#111119] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl overflow-hidden flex flex-col h-[70vh]">
              <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <i className="fas fa-feather-pointed text-indigo-500"></i> Collaborative Tale
                </h2>
              </div>

              <div className="flex-1 p-8 overflow-y-auto space-y-6 scrollbar-thin">
                {room?.story && room.story.length > 0 ? (
                  <div className="space-y-4">
                    {room.story.map((chunk, idx) => (
                      <div key={idx} className="group relative pl-4 border-l-2" style={{ borderLeftColor: chunk.color }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: chunk.color }}>
                            {chunk.authorName} {chunk.isAI ? " (AI)" : ""}
                          </span>
                          <span className="text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            {new Date(chunk.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                          {chunk.text}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <i className="fas fa-pen-nib text-2xl text-slate-300"></i>
                    </div>
                    <p className="text-slate-400 italic">The parchment is empty. Be the first to start the legend...</p>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 dark:bg-white/2 border-t border-slate-100 dark:border-white/5">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddText()}
                    placeholder="Contribute to the story..."
                    className="flex-1 px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:border-indigo-500 shadow-sm transition-all"
                  />
                  <button
                    onClick={handleAddText}
                    disabled={!newText.trim()}
                    className="px-8 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 cursor-pointer active:scale-95"
                  >
                    Add
                  </button>
                  <button
                    onClick={handleAIContinue}
                    title="Ask AI to continue the story"
                    className="w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-purple-500/20 cursor-pointer active:scale-95"
                  >
                    <i className="fas fa-wand-magic-sparkles text-xl"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Side Info */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#111119] rounded-[2rem] border border-slate-200 dark:border-white/5 p-6 shadow-lg">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                <i className="fas fa-users"></i> Writers Online ({room?.participants.length || 0})
              </h3>
              <div className="space-y-3">
                {room?.participants.map((p) => (
                  <div
                    key={p.userId}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full shadow-sm"
                        style={{ backgroundColor: p.color }}
                      ></div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{p.username}</span>
                    </div>
                    {p.userId === user?.userId && (
                      <span className="text-[8px] font-black bg-indigo-500/20 text-indigo-500 px-2 py-0.5 rounded-full">YOU</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <h4 className="font-black text-lg mb-2">Need a Spark?</h4>
                <p className="text-indigo-100 text-xs leading-relaxed mb-4">Click the AI button to let our models suggest the next twist in your collaborative tale.</p>
                <div className="h-1 w-12 bg-white/30 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
