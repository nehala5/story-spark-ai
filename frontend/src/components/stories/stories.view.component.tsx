import React, { useEffect, useState, useRef, useMemo } from "react";
import { getShortenedText, ITopicData, topicsData } from "./stories.utils";
import { formatReadingStats } from "../../utils/story-utils";
import toast, { Toaster } from "react-hot-toast";
import { useCreatePostMutation } from "../../redux/apis/post.api";
import { useGetProfileInfoQuery } from "../../redux/apis/user.api";
import jsPDF from "jspdf";
import BookmarkButton from "../BookmarkButton";
import StoryGeneratingAnimation from "../loading/story-generating-animation.component";
import AudioPlayer, { type AudioPlayerHandle, type NarrationPlaybackState } from "../AudioPlayer";
import { useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setStory } from "../../redux/slices/storySlice";
import StoryCoverImage from "./StoryCoverImage";
import ImageFallback from "../ImageFallback";
import SSProfile from "../ui-component/ss-profile/ss-profile";

export interface IStories {
  uuid: string;
  title: string;
  content: string;
  tag: string;
  imageURL: string;
  language?: string;
  enhancedPrompt?: string;
}

interface StorySentenceSegment {
  id: string;
  text: string;
  startWordIndex: number;
  endWordIndex: number;
}

interface IStoriesViewComponentProps {
  stories: IStories[];
  isLogin: boolean;
  setStories: React.Dispatch<React.SetStateAction<IStories[]>>;
  onPublishSuccess?: () => void;
  isLoading?: boolean;
}

const buildSentenceSegments = (text: string): StorySentenceSegment[] => {
  if (!text) return [];
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [text];
  let currentWordIndex = 0;

  return sentences.map((sentence, idx) => {
    const wordCount = (sentence.trim().match(/\S+/g) || []).length;
    const segment = {
      id: `sentence-${idx}`,
      text: sentence,
      startWordIndex: currentWordIndex,
      endWordIndex: currentWordIndex + wordCount - 1,
    };
    currentWordIndex += wordCount;
    return segment;
  });
};

const StoriesViewComponent: React.FC<IStoriesViewComponentProps> = ({
  stories,
  isLogin,
  setStories,
  onPublishSuccess,
  isLoading,
}) => {
  const location = useLocation();
  const audioPlayerRef = useRef<AudioPlayerHandle>(null);
  const dispatch = useDispatch();

  const [selectedStory, setSelectedStory] = useState<IStories | null>(null);
  const [topics, setTopics] = useState<ITopicData[]>(topicsData);
  const [selectTopics, setSelectTopics] = useState<ITopicData[]>([]);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  const [createPost] = useCreatePostMutation();
  const { data: profile } = useGetProfileInfoQuery(undefined, { skip: !isLogin });
  
  const [narrationWordIndex, setNarrationWordIndex] = useState<number>(0);
  const [narrationState, setNarrationState] = useState<NarrationPlaybackState>("idle");


  useEffect(() => {
    if (stories && stories.length > 0) {
      setSelectedStory(stories[0]);
      dispatch(setStory({
        id: stories[0].uuid,
        title: stories[0].title,
        chapters: [{ id: 1, title: "Chapter 1", content: stories[0].content, createdAt: new Date().toISOString() }],
      }));
    } else {
      setSelectedStory(null);
    }
  }, [stories, dispatch]);

  useEffect(() => {
    setSelectTopics(topics.filter((topic) => topic.selected));
  }, [topics]);

  useEffect(() => {
    const player = audioPlayerRef.current;
    return () => { player?.stop(); };
  }, [location.pathname]);

  useEffect(() => {
    setNarrationWordIndex(0);
    setNarrationState("idle");
  }, [selectedStory?.uuid]);

  const sentenceSegments = useMemo(() => buildSentenceSegments(selectedStory?.content ?? ""), [selectedStory?.content]);

  const handleCopyStory = async () => {
    if (selectedStory?.content) {
      await navigator.clipboard.writeText(selectedStory.content);
      setIsCopied(true);
      toast.success("Story copied!");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleExportPDF = async () => {
    if (!selectedStory) return;
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text(selectedStory.title, 20, 20);
    doc.setFontSize(12);
    const splitText = doc.splitTextToSize(selectedStory.content, 170);
    doc.text(splitText, 20, 30);
    doc.save(`${selectedStory.title.replace(/\s+/g, "_")}.pdf`);
    toast.success("PDF Downloaded!");
  };

  const handleExportMarkdown = () => {
    if (!selectedStory) return;
    const markdownContent = `# ${selectedStory.title}\n\n${selectedStory.content}`;
    const blob = new Blob([markdownContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedStory.title.replace(/\s+/g, "_")}.md`;
    a.click();
    toast.success("Markdown Downloaded!");
  };

  const handlePublishStory = async () => {
    if (!isLogin) { toast.error("Please login to publish."); return; }
    if (!selectedStory) return;
    if (selectTopics.length < 2) { toast.error("Select at least 2 topics."); return; }
    
    setIsPublishing(true);
    try {
      const post = { ...selectedStory, topic: selectTopics, isPublished: true };
      const result = await createPost(post).unwrap();
      if (result) {
        toast.success("Story published!");
        setStories([]);
        setSelectedStory(null);
        onPublishSuccess?.();
      }
    } catch {
      toast.error("Failed to publish.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleTopicClick = (index: number) => {
    setTopics(topics.map((t, i) => i === index ? { ...t, selected: !t.selected } : t));
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <StoryGeneratingAnimation />
    </div>
  );

  if (!stories || !stories.length) return null;
  if (!selectedStory) return null;

  const isNarrationActive = narrationState !== "idle";

  return (
    <div className="mt-16 px-4 sm:px-6 lg:px-8 max-w-8xl mx-auto pb-20 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Main Content Area */}
        <div className="col-span-1 lg:col-span-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
                {selectedStory.title}
              </h1>
              <div className="flex flex-wrap gap-3 items-center">
                <span className="px-3 py-1 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  {selectedStory.tag}
                </span>
                <span className="px-3 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  {selectedStory.language || "English"}
                </span>
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  {formatReadingStats(selectedStory.content)}
                </span>
              </div>
            </div>

            <div className="flex -space-x-3">
              {stories.map((story) => (
                <button
                  key={story.uuid}
                  onClick={() => setSelectedStory(story)}
                  className={`w-14 h-14 rounded-full border-2 transition-all duration-300 overflow-hidden ${
                    selectedStory.uuid === story.uuid ? "border-indigo-500 scale-110 z-10 shadow-lg shadow-indigo-500/20" : "border-slate-700 hover:border-slate-500 scale-100"
                  }`}
                >
                  <ImageFallback src={story.imageURL} alt={story.title} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 relative z-10">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <i className="fas fa-feather-pointed text-indigo-400"></i> The Tale
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={handleCopyStory} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer">
                  {isCopied ? "✓ Copied" : "Copy"}
                </button>
                <button onClick={handleExportPDF} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-indigo-500/20">
                  PDF
                </button>
                <button onClick={handleExportMarkdown} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer">
                  Markdown
                </button>
              </div>
            </div>

            <div className="prose prose-invert max-w-none relative z-10">
              <p className="text-lg leading-relaxed text-slate-300 whitespace-pre-wrap font-medium">
                {sentenceSegments.length > 0 ? (
                  sentenceSegments.map((segment) => {
                    const isActive = isNarrationActive && narrationWordIndex >= segment.startWordIndex && narrationWordIndex <= segment.endWordIndex;
                    return (
                      <span key={segment.id} className={isActive ? "text-white bg-indigo-500/20 rounded-md px-1 transition-colors duration-300" : "transition-colors duration-300"}>
                        {segment.text}
                      </span>
                    );
                  })
                ) : (
                  selectedStory.content
                )}
              </p>
            </div>

            <div className="mt-10 pt-8 border-t border-white/5 relative z-10">
              <AudioPlayer
                ref={audioPlayerRef}
                text={selectedStory.content}
                title={selectedStory.title}
                onWordIndexChange={setNarrationWordIndex}
                onPlaybackStateChange={setNarrationState}
              />
            </div>
          </div>
        </div>

        {/* Sidebar / Preview Area */}
        <div className="col-span-1 lg:col-span-4 space-y-8">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-6">Story Settings</h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Publish Topics</label>
                <div className="flex flex-wrap gap-2">
                  {topics.map((topic, i) => (
                    <button
                      key={topic.title}
                      onClick={() => handleTopicClick(i)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer border ${
                        topic.selected ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      {topic.title}
                    </button>
                  ))}
                </div>
              </div>

              <button
                id="publish-story-btn"
                onClick={handlePublishStory}
                disabled={isPublishing || !selectedStory}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
              >
                {isPublishing ? "PUBLISHING..." : "PUBLISH TO COMMUNITY"}
              </button>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl group">
            <div className="aspect-[4/3] relative">
              <StoryCoverImage title={selectedStory.title} tag={selectedStory.tag} />
              <div className="absolute top-4 right-4">
                <BookmarkButton storyId={selectedStory.uuid} className="bg-black/20 backdrop-blur-md border border-white/10 p-2 rounded-full text-white" />
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <SSProfile name={profile?.name || "Guest"} size="h-10 w-10" />
                <div>
                  <p className="text-sm font-bold text-white">{profile?.name || "Guest Author"}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {formatReadingStats(selectedStory.content)}
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed line-clamp-3 italic">
                "{getShortenedText(selectedStory.content, 25)}"
              </p>
            </div>
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

export default StoriesViewComponent;
