import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Post } from "../../../models/post";
import { useGetFeaturedListsQuery } from "../../../redux/apis/post.api";
import { formatDateShort } from "../../../utils/time-formate";
import { formatReadingStats } from "../../../utils/story-utils";
import SSProfile from "../../ui-component/ss-profile/ss-profile";
import BookmarkButton from "../../BookmarkButton";
import ImageFallback from "../../ImageFallback";
import { FaLinkedin, FaEnvelope, FaLink } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import toast from "react-hot-toast";

const FeatureComponent = () => {
  const { data, isLoading, isError, refetch } = useGetFeaturedListsQuery(undefined);
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = async (e: React.MouseEvent, postId: string, url: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(postId);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  if (isLoading) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Featured Posts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-gray-200 dark:bg-slate-800 h-80" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mb-12 rounded-2xl border border-red-500/20 bg-red-500/10 p-10 text-center">
        <p className="mb-4 font-semibold text-red-700 dark:text-red-300">Failed to load featured posts.</p>
        <button
          onClick={() => refetch()}
          className="rounded-lg bg-red-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-red-700 cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="mb-16">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-8">
        Featured Stories
      </h2>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {(data?.posts?.length ?? 0) > 0 ? (
          data?.posts?.map((post: Post) => {
            const postUrl = `${window.location.origin}/post/${post._id}`;

            return (
              <div
                key={post._id}
                onClick={() => navigate(`/post/${post._id}`)}
                className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[2rem] border border-slate-200 dark:border-white/5 bg-white dark:bg-[#111827] transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10"
              >
                <div className="relative h-48 overflow-hidden">
                  <ImageFallback
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    src={post.imageURL}
                    alt={post.title}
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg">
                      {post.tag}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center">
                      <SSProfile name={post.author?.name || "Unknown"} size="h-9 w-9" />
                      <div className="ml-3 min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-gray-200">
                          {post.author?.name || "Unknown"}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase font-medium">
                          {formatDateShort(post.createdAt)} • {formatReadingStats(post.content)}
                        </p>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <BookmarkButton
                        storyId={post._id}
                        bookmarks={post.bookmarks}
                        className="rounded-full p-2 hover:bg-indigo-50 dark:hover:bg-white/5 transition-colors"
                      />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-tight">
                    {post.title}
                  </h3>

                  <p className="text-sm text-slate-600 dark:text-gray-400 mb-6 line-clamp-2 leading-relaxed flex-1">
                    {post.content}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5 mt-auto">
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                      <span className="flex items-center gap-1.5 hover:text-rose-500 transition-colors">
                        <i className="fas fa-heart text-rose-400/50"></i> {post.likesCount ?? 0}
                      </span>
                      <span className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors">
                        <i className="fas fa-comment text-indigo-400/50"></i> {post.commentsCount ?? 0}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400">
                      <a
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(post.title || "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-sky-400 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FaXTwitter size={14} />
                      </a>
                      <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FaLinkedin size={14} />
                      </a>
                      <button
                        onClick={(e) => handleCopyLink(e, post._id, postUrl)}
                        className={`hover:text-indigo-500 transition-colors ${copiedId === post._id ? "text-green-500" : ""}`}
                      >
                        <FaLink size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center rounded-3xl border border-dashed border-slate-300 dark:border-white/10">
            <p className="text-slate-500">No featured stories available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeatureComponent;
