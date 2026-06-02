import React, { useState } from "react";
import { Link } from "react-router-dom";
import { isLoggedIn } from "../../../services/auth.service";
import { useToggleFollowMutation } from "../../../redux/apis/user.api";
import ImageFallback from "../../ImageFallback";
import toast from "react-hot-toast";

const RecommendedWritersComponent = () => {
  const recommendedWriters = [
    {
      id: "roni-sarkar-id",
      name: "Roni Sarkar",
      role: "AI Writer",
      image: "https://avatars.githubusercontent.com/u/76697055?v=4",
    },
    {
      id: "sarah-lee-id",
      name: "Sarah Lee",
      role: "Content Creator",
      image: "https://i.pravatar.cc/150?img=5",
    },
    {
      id: "john-doe-id",
      name: "John Doe",
      role: "Story Writer",
      image: "https://i.pravatar.cc/150?img=8",
    },
  ];

  const [following, setFollowing] = useState<string[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [toggleFollowMutation, { isLoading }] = useToggleFollowMutation();

  const toggleFollow = async (authorId: string) => {
    if (!isLoggedIn()) {
      setShowLoginModal(true);
      return;
    }

    try {
      await toggleFollowMutation(authorId).unwrap();
      if (following.includes(authorId)) {
        setFollowing(following.filter((id) => id !== authorId));
        toast.success("Unfollowed successfully");
      } else {
        setFollowing([...following, authorId]);
        toast.success("Followed successfully");
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
      toast.error("Failed to toggle follow");
    }
  };

  return (
    <>
      <section className="bg-white dark:bg-blue-500/10 rounded-2xl border border-slate-200 dark:border-white/5 p-6 transition-all duration-300">
        <h3 className="text-lg font-bold text-slate-900 dark:text-gray-200 mb-6">
          Recommended Writers
        </h3>

        <div className="space-y-5">
          {recommendedWriters.map((writer) => (
            <div key={writer.id} className="flex items-center justify-between group">
              <div className="flex items-center">
                <div className="relative">
                  <ImageFallback
                    className="h-11 w-11 rounded-full object-cover border-2 border-slate-100 dark:border-white/10 group-hover:border-indigo-500 transition-colors"
                    src={writer.image}
                    alt={writer.name}
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#0f172a] rounded-full"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-bold text-slate-800 dark:text-gray-200">
                    {writer.name}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {writer.role}
                  </p>
                </div>
              </div>
              <button
                disabled={isLoading}
                onClick={() => toggleFollow(writer.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                  following.includes(writer.id)
                    ? "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 cursor-pointer"
                } disabled:opacity-50`}
              >
                {following.includes(writer.id) ? "Following" : "Follow"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-2xl max-w-md w-full p-8 transform transition-all text-slate-900 dark:text-white">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-user-lock text-2xl text-blue-500"></i>
              </div>

              <h3 className="text-2xl font-black mb-2">
                Authentication Required
              </h3>

              <p className="text-slate-500 dark:text-gray-400 mb-8 leading-relaxed">
                Join our community to follow your favorite writers and stay updated with their latest stories.
              </p>

              <div className="flex flex-col gap-3">
                <Link
                  to="/login"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-500/25"
                >
                  Log In
                </Link>

                <Link
                  to="/signup"
                  className="w-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white font-bold py-3.5 px-4 rounded-xl transition-all border border-slate-200 dark:border-white/10"
                >
                  Create Account
                </Link>

                <button
                  onClick={() => setShowLoginModal(false)}
                  className="w-full bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400 hover:text-slate-500 font-bold py-3 px-4 rounded-xl transition-all mt-2 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RecommendedWritersComponent;
