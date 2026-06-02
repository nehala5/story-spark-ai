import { useState } from "react";
import logo from "../../assets/logo.png";
import ImageFallback from "../ImageFallback";
import { useGetProfileInfoQuery } from "../../redux/apis/user.api";
import { Link } from "react-router-dom";

const TopHeaderComponent = () => {
  const [, setShowNotification] = useState<boolean>(false);
  const { data } = useGetProfileInfoQuery();

  return (
    <div className="sticky top-0 z-50 transition-all duration-300">
      <div className="relative z-10 mx-auto max-w-8xl px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-12">
            <Link to="/" className="flex items-center space-x-2 group">
              <img src={logo} alt="Logo" className="h-8 w-auto group-hover:scale-110 transition-transform" />
            </Link>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-xs font-bold tracking-widest text-white/70 hover:text-white transition-colors">HOME</Link>
              <Link to="/explore" className="text-xs font-bold tracking-widest text-white/70 hover:text-white transition-colors">EXPLORE</Link>
              <Link to="/community" className="text-xs font-bold tracking-widest text-white/70 hover:text-white transition-colors">COMMUNITY</Link>
            </nav>
          </div>

          <div className="flex items-center space-x-5">
            {!data && (
              <Link to="/signup" className="hidden sm:block px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold tracking-widest rounded-full transition-all shadow-lg shadow-indigo-500/20">
                JOIN NOW
              </Link>
            )}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-full transition-all cursor-pointer"
              >
                <i className="fas fa-search text-sm"></i>
              </button>

              <button
                type="button"
                className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-full transition-all cursor-pointer relative"
                onClick={() => setShowNotification(true)}
              >
                <i className="fa-solid fa-bell text-sm"></i>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border border-slate-900"></span>
              </button>

              <div className="pl-2 border-l border-white/10">
                <Link to={data ? "/dashboard" : "/login"}>
                  <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-white/10 hover:border-indigo-500 transition-all cursor-pointer">
                    <ImageFallback
                      src={data?.profile?.avatar || "https://ui-avatars.com/api/?name=User"}
                      alt="profile"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
      </div>
    </div>
  );
};

export default TopHeaderComponent;
