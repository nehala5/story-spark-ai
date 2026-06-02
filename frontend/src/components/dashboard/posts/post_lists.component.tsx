import React, { useState, useMemo } from "react";
import { useGetPostListsQuery } from "../../../redux/apis/post.api";
import { useDebounced } from "../../../hooks/global";
import { Topic, Post } from "../../../models/post";
import PaginationComponent from "../../pagination/pagination.component";
import SSProfile from "../../ui-component/ss-profile/ss-profile";

interface FilterStats {
  total: number;
  published: number;
  drafts: number;
  featured: number;
}

const PostListsComponent: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [size, setSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft" | "featured">("all");
  
  const query: Record<string, string | number> = {
    page,
    limit: size,
  };

  const debounceTerm = useDebounced({
    searchQuery: searchTerm,
    daley: 600,
  });

  if (debounceTerm) {
    query["searchTerm"] = debounceTerm;
  }

  const { data, isLoading } = useGetPostListsQuery({ ...query });

  const filterStats: FilterStats = useMemo(() => {
    const posts = data?.posts || [];
    return {
      total: posts.length,
      published: posts.filter((p: Post) => p.isPublished).length,
      drafts: posts.filter((p: Post) => !p.isPublished).length,
      featured: posts.filter((p: Post) => p.isFeaturedPost).length,
    };
  }, [data?.posts]);

  const filteredPosts = useMemo(() => {
    let filtered = data?.posts || [];
    
    switch (filterStatus) {
      case "published":
        filtered = filtered.filter((p: Post) => p.isPublished);
        break;
      case "draft":
        filtered = filtered.filter((p: Post) => !p.isPublished);
        break;
      case "featured":
        filtered = filtered.filter((p: Post) => p.isFeaturedPost);
        break;
      default:
        break;
    }
    
    return filtered;
  }, [data?.posts, filterStatus]);

  const onPaginationChange = (page: number, pageSize: number) => {
    setPage(page);
    setSize(pageSize);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTopicBadges = (topics?: Topic[]) => {
    if (!topics) return null;
    return (
      <div className="flex flex-wrap gap-1.5 max-w-[200px]">
        {topics.map((topic) => (
          <span
            key={topic._id}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border"
            style={{
              backgroundColor: `${topic.color}15`,
              color: topic.color,
              borderColor: `${topic.color}35`,
            }}
          >
            {topic.title}
          </span>
        ))}
      </div>
    );
  };

  const getStatusBadge = (isPublished: boolean, isFeatured: boolean = false) => {
    if (isFeatured) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <i className="fas fa-star text-[8px]"></i>
          Featured
        </span>
      );
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border ${
        isPublished ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? "bg-emerald-400" : "bg-amber-400"}`}></span>
        {isPublished ? "Published" : "Draft"}
      </span>
    );
  };

  const StatCard = ({ icon, label, count, color, isActive }: { icon: string; label: string; count: number; color: string; isActive: boolean }) => (
    <button
      onClick={() => {
        if (label === "All Posts") setFilterStatus("all");
        else if (label === "Published") setFilterStatus("published");
        else if (label === "Drafts") setFilterStatus("draft");
        else if (label === "Featured") setFilterStatus("featured");
      }}
      className={`flex-1 p-4 rounded-xl border transition-all duration-300 cursor-pointer text-left ${
        isActive
          ? `bg-gradient-to-br ${color} border-white/10 shadow-lg`
          : "bg-[#141624]/40 border-gray-800/40 hover:border-gray-700/60 hover:bg-[#0f1119]/60"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-[10px] uppercase tracking-wider font-bold ${isActive ? "text-white/80" : "text-gray-400"}`}>{label}</p>
          <p className={`text-xl font-bold mt-1 ${isActive ? "text-white" : "text-gray-200"}`}>{count}</p>
        </div>
        <i className={`${icon} text-2xl ${isActive ? "text-white/40" : "text-gray-600"}`}></i>
      </div>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-[#1a1d2d] to-[#0f1119] border border-gray-800/60 rounded-2xl p-6 lg:p-8 relative overflow-hidden">
        <div className="relative z-10">
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Posts Management</h1>
            <p className="text-gray-400 text-sm max-w-2xl">Create and manage your stories. Monitor metrics and track performance.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon="fas fa-file" label="All Posts" count={filterStats.total} color="from-blue-600/20 to-blue-500/10" isActive={filterStatus === "all"} />
            <StatCard icon="fas fa-check-circle" label="Published" count={filterStats.published} color="from-emerald-600/20 to-emerald-500/10" isActive={filterStatus === "published"} />
            <StatCard icon="fas fa-file-alt" label="Drafts" count={filterStats.drafts} color="from-amber-600/20 to-amber-500/10" isActive={filterStatus === "draft"} />
            <StatCard icon="fas fa-star" label="Featured" count={filterStats.featured} color="from-purple-600/20 to-purple-500/10" isActive={filterStatus === "featured"} />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                <i className="fas fa-search"></i>
              </div>
              <input
                type="text"
                className="w-full pl-11 pr-4 py-3 bg-[#0f1119] border border-gray-700/50 rounded-xl text-gray-200 placeholder:text-gray-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20">
              <i className="fas fa-plus"></i>
              New Post
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#0f1119] border border-gray-800/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#141624]/80 border-b border-gray-800/60">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Post Info</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Author</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Stats</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {isLoading ? (
                [...Array(size)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-4 h-16">
                      <div className="h-4 bg-gray-800/40 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : (
                filteredPosts.map((post) => (
                  <tr key={post._id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="text-sm font-bold text-gray-200 group-hover:text-blue-400 transition-colors mb-1">{post.title}</div>
                      {getTopicBadges(post.topic)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <SSProfile name={post.author?.name || "Unknown"} size="h-7 w-7" />
                        <div>
                          <p className="text-xs font-bold text-gray-300">{post.author?.name}</p>
                          <p className="text-[10px] text-gray-500">{formatDate(post.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {getStatusBadge(post.isPublished, post.isFeaturedPost)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-center" title="Likes">
                          <p className="text-xs font-bold text-rose-400">{post.likesCount}</p>
                          <i className="fas fa-heart text-[10px] text-rose-400/40"></i>
                        </div>
                        <div className="text-center" title="Comments">
                          <p className="text-xs font-bold text-blue-400">{post.commentsCount}</p>
                          <i className="fas fa-comment text-[10px] text-blue-400/40"></i>
                        </div>
                        <div className="text-center" title="Views">
                          <p className="text-xs font-bold text-emerald-400">{post.viewsCount}</p>
                          <i className="fas fa-eye text-[10px] text-emerald-400/40"></i>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer">
                          <i className="fas fa-edit text-xs"></i>
                        </button>
                        <button className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer">
                          <i className="fas fa-trash-alt text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data?.meta && (
          <div className="p-6 border-t border-gray-800/60 bg-[#141624]/30">
            <PaginationComponent
              current={page}
              pageSize={size}
              total={data.meta.total}
              onChange={onPaginationChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PostListsComponent;
