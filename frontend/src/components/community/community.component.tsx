import React from 'react';
import GenreCard from './genre_card.component';
import { isLoggedIn } from '../../services/auth.service';
import { genres, featuredWriters, stats } from './community.data';
import GithubcontributorsComponent from './Githubcontributors.component';
import ImageFallback from "../ImageFallback";

const CommunityComponent: React.FC = () => {
  const isLogin = isLoggedIn();

  return (
    <div className="min-h-screen bg-white text-slate-900 transition-colors duration-300 dark:bg-[#081120] dark:text-white">
      {/* Hero Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-600 text-xs font-semibold tracking-[0.2em] uppercase mb-6 dark:bg-blue-500/5 dark:text-blue-400">
                Explore Communities
              </div>

              <h2 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">
                Discover Your Writing Universe
              </h2>

              <p className="text-lg leading-relaxed text-slate-600 dark:text-gray-400">
                Find your niche and connect with specialists in your favorite storytelling styles.
              </p>
            </div>

            <button className="text-blue-600 font-semibold hover:translate-x-1 transition-transform dark:text-blue-400">
              VIEW ALL GENRES →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {genres.map((genre, index) => (
              <GenreCard
                key={index}
                title={genre.title}
                description={genre.description}
                icon={genre.icon}
                count={genre.count}
                color={genre.color}
                isLogin={isLogin}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 dark:bg-white/5 py-16 border-y border-gray-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">{stat.value}</div>
                <div className="text-sm uppercase tracking-widest text-slate-500 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Writers Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-600 text-xs font-semibold tracking-[0.2em] uppercase mb-6 dark:bg-purple-500/5 dark:text-purple-400">
              Community Spotlight
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">Meet the Pioneers</h2>
            <p className="text-slate-600 dark:text-gray-400">Discover top authors and their AI-assisted masterpieces.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {featuredWriters.map((writer, idx) => (
              <div key={idx} className="flex flex-col items-center text-center group">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    <ImageFallback
                      src={writer.avatar}
                      alt={writer.name}
                      className="w-24 h-24 rounded-full border-2 border-white/10 group-hover:border-blue-500 transition-colors relative z-10 object-cover"
                    />
                </div>
                <h3 className="text-xl font-bold mb-1 text-slate-900 dark:text-white">{writer.name}</h3>
                <p className="text-blue-600 dark:text-blue-400 text-sm mb-4">{writer.role}</p>
                <div className="text-xs text-slate-500 uppercase tracking-widest">
                  {writer.stories} Stories Published
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GitHub Contributors Section */}
      <GithubcontributorsComponent />
    </div>
  );
};

export default CommunityComponent;
