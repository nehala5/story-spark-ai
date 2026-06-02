import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetLatestListsQuery } from "../../../redux/apis/post.api";
import { Post } from "../../../models/post";
import LoadingAnimation from "../../loading/loading.component";

const LatestPostsComponent = () => {
  const { data, isLoading, isError, refetch } = useGetLatestListsQuery(undefined);
  const navigate = useNavigate();
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Latest Posts</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-16 rounded-xl bg-gray-200 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mb-12 rounded-2xl border border-red-500/20 bg-red-500/10 p-10 text-center">
        <p className="mb-4 font-semibold text-red-700 dark:text-red-300">Failed to load latest posts.</p>
        <button
          onClick={() => refetch()}
          className="rounded-lg bg-red-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-red-700 cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const seenIds = new Set<string>();
  const uniquePosts = (data?.posts ?? []).filter((post: Post) => {
    if (!post?._id || seenIds.has(post._id)) return false;
    seenIds.add(post._id);
    return true;
  });

  const toggleAccordion = (postId: string) => {
    setExpandedPostId((prevId) => (prevId === postId ? null : postId));
  };

  return (
    <div className="mb-16">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-8">
        Latest Activity
      </h2>

      <div className="space-y-4">
        {uniquePosts.length > 0 ? (
          uniquePosts.map((post: Post) => {
            const isExpanded = expandedPostId === post._id;

            return (
              <div
                key={post._id}
                className={`rounded-2xl border transition-all duration-300 ${
                  isExpanded 
                    ? "border-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-lg" 
                    : "border-slate-200 dark:border-white/5 bg-white dark:bg-[#111827] hover:border-indigo-500/20"
                }`}
              >
                <button
                  onClick={() => toggleAccordion(post._id)}
                  className="w-full flex items-center justify-between p-5 text-left cursor-pointer group"
                >
                  <span className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {post.title}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isExpanded ? "bg-indigo-500 text-white rotate-180" : "bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500"
                  }`}>
                    <i className="fas fa-chevron-down text-xs"></i>
                  </div>
                </button>

                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                }`}>
                  <div className="p-5 pt-0 border-t border-slate-100 dark:border-white/5">
                    <p className="text-slate-600 dark:text-gray-400 leading-relaxed mb-6 whitespace-pre-wrap">
                      {post.content}
                    </p>
                    <div className="flex justify-end">
                      <button
                        onClick={() => navigate(`/post/${post._id}`)}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
                      >
                        Read Full Story
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-white/10">
            <p className="text-slate-500">No recent activity to show.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LatestPostsComponent;
