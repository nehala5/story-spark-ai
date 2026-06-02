import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGetPostListsQuery } from "../../../redux/apis/post.api";
import { Post } from "../../../models/post";
import SSProfile from "../../ui-component/ss-profile/ss-profile";
import LoadingAnimation from "../../loading/loading.component";

interface WriterStats {
  author: any;
  storiesCount: number;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  bookmarksCount: number;
  topPost: Post;
  engagementScore: number;
}

const TOP_WRITERS_LIMIT = 3;

const rankStyles = [
  {
    ring: "ring-amber-400 dark:ring-amber-500/50 shadow-[0_0_20px_rgba(251,191,36,0.2)]",
    badge: "bg-amber-400 text-amber-950",
    label: "Story Master",
  },
  {
    ring: "ring-slate-300 dark:ring-slate-400/50 shadow-[0_0_20px_rgba(203,213,225,0.2)]",
    badge: "bg-slate-300 text-slate-900",
    label: "Top Artisan",
  },
  {
    ring: "ring-orange-400 dark:ring-orange-500/50 shadow-[0_0_20px_rgba(251,146,60,0.2)]",
    badge: "bg-orange-400 text-orange-950",
    label: "Rising Creator",
  },
];

const CommunitySpotlightComponent = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useGetPostListsQuery({
    limit: 100,
    page: 1,
  });

  const formatMetric = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toString();
  };

  const topWriters = useMemo(() => {
    if (!data?.posts) return [];

    const writers = new Map<string, WriterStats>();

    const getBookmarkCount = (post: Post) =>
      Array.isArray(post.bookmarks) ? post.bookmarks.length : 0;

    const getPostEngagementScore = (post: Post) => {
      return (
        (post.viewsCount ?? 0) * 1 +
        (post.likesCount ?? 0) * 3 +
        (post.commentsCount ?? 0) * 5 +
        getBookmarkCount(post) * 8
      );
    };

    const getWriterEngagementScore = (writer: WriterStats) => {
      return (
        writer.viewsCount * 0.5 +
        writer.likesCount * 2 +
        writer.commentsCount * 4 +
        writer.bookmarksCount * 6 +
        writer.storiesCount * 15
      );
    };

    data.posts.forEach((post: Post) => {
      if (!post.author) return;
      const authorId = post.author._id || post.author.email || post.author.name;
      if (!authorId) return;

      const postScore = getPostEngagementScore(post);

      if (!writers.has(authorId)) {
        writers.set(authorId, {
          author: post.author,
          storiesCount: 1,
          likesCount: post.likesCount ?? 0,
          commentsCount: post.commentsCount ?? 0,
          viewsCount: post.viewsCount ?? 0,
          bookmarksCount: getBookmarkCount(post),
          topPost: post,
          engagementScore: 0,
        });
        return;
      }

      const existingWriter = writers.get(authorId)!;
      existingWriter.storiesCount += 1;
      existingWriter.likesCount += post.likesCount ?? 0;
      existingWriter.commentsCount += post.commentsCount ?? 0;
      existingWriter.viewsCount += post.viewsCount ?? 0;
      existingWriter.bookmarksCount += getBookmarkCount(post);

      if (postScore > getPostEngagementScore(existingWriter.topPost)) {
        existingWriter.topPost = post;
      }
    });

    return Array.from(writers.values())
      .map((writer) => ({
        ...writer,
        engagementScore: getWriterEngagementScore(writer),
      }))
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, TOP_WRITERS_LIMIT);
  }, [data?.posts]);

  if (isLoading) return <LoadingAnimation />;

  if (isError) {
    return (
      <section className="px-5 py-10">
        <div className="max-w-7xl mx-auto rounded-2xl border border-red-500/20 bg-red-500/10 p-10 text-center">
          <p className="mb-4 font-semibold text-red-700 dark:text-red-300">Failed to load spotlight stories.</p>
          <button
            onClick={() => refetch()}
            className="rounded-lg bg-red-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-red-700 cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="px-5 py-16 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              Community Spotlight
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
              Meet the Pioneers
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600 dark:text-gray-400 leading-relaxed">
              Ranked by stories, engagement, and impact within our growing ecosystem of AI-assisted creators.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 shadow-sm">
            <i className="fas fa-wand-magic-sparkles text-xs"></i>
            Reader powered
          </div>
        </div>

        {topWriters.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {topWriters.map((writer, index) => {
              const rank = index + 1;
              const style = rankStyles[index] || rankStyles[2];

              return (
                <button
                  key={writer.author._id || writer.author.email || writer.author.name}
                  type="button"
                  onClick={() => navigate(`/post/${writer.topPost._id}`)}
                  className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 text-left transition-all duration-500 ease-out cursor-pointer hover:bg-indigo-50 dark:bg-[#111827] dark:border-white/5 dark:hover:bg-indigo-950/20 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/20"
                >
                  <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

                  <div className="mb-8 flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className={`rounded-full ring-4 ${style.ring} transition-transform duration-300 group-hover:scale-110`}>
                        <SSProfile name={writer.author.name || "Unknown User"} size="h-14 w-12" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xl font-black text-slate-900 dark:text-white">
                          {writer.author.name || "Unknown User"}
                        </p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-gray-400">
                          {style.label}
                        </p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black shadow-md ${style.badge}`}>
                      #{rank}
                    </span>
                  </div>

                  <div className="mb-6 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-white/5 dark:bg-white/5">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-gray-400">
                      Top story
                    </p>
                    <h3 className="line-clamp-2 text-lg font-bold leading-tight text-slate-900 dark:text-white transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {writer.topPost.title}
                    </h3>
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-indigo-50 px-4 py-3 dark:bg-indigo-500/10 border border-indigo-100/50 dark:border-white/5">
                      <p className="text-xl font-black text-indigo-700 dark:text-indigo-300">{formatMetric(writer.engagementScore)}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Score</p>
                    </div>
                    <div className="rounded-xl bg-violet-50 px-4 py-3 dark:bg-violet-500/10 border border-violet-100/50 dark:border-white/5">
                      <p className="text-xl font-black text-violet-700 dark:text-violet-300">{formatMetric(writer.storiesCount)}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Stories</p>
                    </div>
                    <div className="rounded-xl bg-slate-100 px-4 py-3 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                      <p className="text-xl font-black text-slate-800 dark:text-gray-200">{formatMetric(writer.likesCount)}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Likes</p>
                    </div>
                    <div className="rounded-xl bg-slate-100 px-4 py-3 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                      <p className="text-xl font-black text-slate-800 dark:text-gray-200">{formatMetric(writer.viewsCount)}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Views</p>
                    </div>
                  </div>

                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 transition-colors group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                    Read top story
                    <i className="fas fa-arrow-right text-xs transition-transform duration-300 group-hover:translate-x-1.5"></i>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50/50 px-10 py-16 text-center text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            <i className="fas fa-users text-4xl mb-4 opacity-20"></i>
            <p className="font-medium italic">No top contributors identified yet in the current cycle.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default CommunitySpotlightComponent;
