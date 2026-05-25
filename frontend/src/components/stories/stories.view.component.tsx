import React, { useEffect, useState } from "react";
import { getShortenedText, ITopicData, topicsData, getWordCount } from "./stories.utils";
import toast, { Toaster } from "react-hot-toast";
import { useCreatePostMutation } from "../../redux/apis/post.api";
import { useGetProfileInfoQuery } from "../../redux/apis/user.api";
import jsPDF from "jspdf";
import BookmarkButton from "../BookmarkButton";

export interface IStories {
  uuid: string;
  title: string;
  content: string;
  tag: string;
  imageURL: string;
}

interface IPost extends IStories {
  topic: ITopicData[];
}

interface StoriesComponentProps {
  stories: IStories[];
  isLogin: boolean;
  setStories: (stories: IStories[]) => void;
}

const StoriesViewComponent: React.FC<StoriesComponentProps> = ({
  stories,
  isLogin,
  setStories,
}) => {
  // Start with a clean state that adapts dynamically
  const [selectedStory, setSelectedStory] = useState<IStories | null>(null);
  const [topics, setTopics] = useState<ITopicData[]>(topicsData);
  const [selectTopics, setSelectTopics] = useState<ITopicData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [createPost] = useCreatePostMutation();
  const { data: profile } = useGetProfileInfoQuery(undefined, { skip: !isLogin });

  useEffect(() => {
    setSelectTopics(topics.filter((topic) => topic.selected));
  }, [topics]);

  // Sync state instantly whenever a new template is submitted or selected
  useEffect(() => {
    if (stories && stories.length > 0) {
      setSelectedStory(stories[0]);
    } else {
      setSelectedStory(null);
    }
  }, [stories]);

useEffect(() => {
  const autoSaveStory = async () => {
    if (!selectedStory) return;

    const post: IPost = {
      ...selectedStory,
      topic: selectTopics,
    };

    try {
      await createPost(post).unwrap();
      toast.success("Story auto-saved!");
    } catch (error) {
      console.error("Auto-save failed", error);
    }
  };

  autoSaveStory();
}, [selectedStory, isLogin, selectTopics]);

  const handelStorySelection = (story: IStories) => {
    setSelectedStory(story);
  };

  const handleTopicClick = (index: number) => {
    const updatedTopics = [...topics];
    updatedTopics[index].selected = !updatedTopics[index].selected;
    setTopics(updatedTopics);
  };

  const handleCopyStory = async () => {
    if (selectedStory?.content) {
      await navigator.clipboard.writeText(selectedStory.content);
      setIsCopied(true);
      toast.success("Story copied!");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleExportPDF = () => {
    if (!selectedStory) {
      toast.error("No story available to export.");
      return;
    }

    try {
      const doc = new jsPDF();
      const title = selectedStory.title || "Story";
      const content = selectedStory.content || "";
      const tag = selectedStory.tag || "General";
      const dateStr = new Date().toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const authorName = isLogin && profile?.name ? profile.name : "Anonymous";

      const marginX = 20;
      const marginTop = 25;
      const marginBottom = 25;
      const pageHeight = 297;
      const printableWidth = 210 - (2 * marginX);

      let currentY = marginTop;

      // 1. Draw Tag
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(124, 58, 237); // Purple/indigo theme color
      doc.text(tag.toUpperCase(), marginX, currentY);
      currentY += 6;

      // 2. Draw Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // Slate-900
      const splitTitle = doc.splitTextToSize(title, printableWidth);
      doc.text(splitTitle, marginX, currentY);
      currentY += splitTitle.length * 8;

      // 3. Draw Metadata (Author & Date)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // Slate-500
      const authorLine = `By ${authorName} • ${dateStr}`;
      doc.text(authorLine, marginX, currentY);
      currentY += 8;

      // 4. Draw Divider Line
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.setLineWidth(0.5);
      doc.line(marginX, currentY, 210 - marginX, currentY);
      currentY += 12;

      // 5. Draw Content
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85); // Slate-700
      
      const contentLines = doc.splitTextToSize(content, printableWidth);
      const lineSpacing = 6.5;

      contentLines.forEach((line: string) => {
        if (currentY + lineSpacing > pageHeight - marginBottom) {
          doc.addPage();
          currentY = marginTop;
        }
        doc.text(line, marginX, currentY);
        currentY += lineSpacing;
      });

      // 6. Draw Header and Footer on all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Footer rule
        doc.setDrawColor(241, 245, 249); // Slate-100
        doc.setLineWidth(0.5);
        doc.line(marginX, pageHeight - 15, 210 - marginX, pageHeight - 15);

        // Footer text
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // Slate-400

        // Brand signature
        doc.text("Generated by StorySparkAI", marginX, pageHeight - 10);

        // Page numbers
        const pageStr = `Page ${i} of ${totalPages}`;
        doc.text(pageStr, 210 - marginX - doc.getTextWidth(pageStr), pageHeight - 10);
      }

      const fileName = title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "story";
      doc.save(`${fileName}.pdf`);
      toast.success("PDF downloaded!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export PDF.");
    }
  };

  const handleExportMarkdown = () => {
    if (!selectedStory) {
      toast.error("No story available to export.");
      return;
    }

    try {
      const title = selectedStory.title || "Story";
      const content = selectedStory.content || "";
      const tag = selectedStory.tag || "General";
      const authorName = isLogin && profile?.name ? profile.name : "Anonymous";
      const isoDate = new Date().toISOString().split("T")[0];

      const cleanTitle = title.replace(/"/g, '\\"');
      const cleanTag = tag.replace(/"/g, '\\"');
      const cleanAuthor = authorName.replace(/"/g, '\\"');

      const markdownContent = `---
title: "${cleanTitle}"
tag: "${cleanTag}"
author: "${cleanAuthor}"
date: "${isoDate}"
---

# ${title}

${content}
`;

      const blob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const fileName = title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "story";
      link.setAttribute("download", `${fileName}.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Markdown downloaded!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export Markdown.");
    }
  };

  const handelPublishStory = async () => {
    if (!isLogin) {
      toast.error("Please login to publish the story.");
      return;
    }
    if (!selectedStory) {
      toast.error("No story available. Please generate a story first.");
      return;
    }
    const post: IPost = {
      ...selectedStory,
      topic: selectTopics,
    };
    setLoading(true);
    try {
      const result = await createPost(post).unwrap();
      if (result) {
        toast.success("Story published successfully!");
        setStories([]);
        setSelectedStory(null);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateReadingTime = (content: string): number => {
    const words = getWordCount(content);
    return Math.max(1, Math.ceil(words / 200));
  };

  // If no generation has run yet, show the beautiful fallback wizard panel
  if (!selectedStory) {
    return (
      <div className="mt-16 px-4 sm:px-6 lg:px-8 pb-16 flex justify-center w-full">
        <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-8 sm:p-12 text-center text-slate-400 max-w-2xl w-full shadow-lg transition-all duration-500 mx-auto">
          <div className="text-5xl mb-6 animate-pulse">✨</div>
          <h3 className="text-2xl font-bold text-slate-200 tracking-wide">
            Your AI-generated story will appear here
          </h3>
          <p className="mt-3 text-base text-slate-400">
            Enter a creative prompt on the left and let StorySparkAI craft something magical.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-16 px-4 sm:px-6 lg:px-8 max-w-8xl mx-auto pb-10">
      <style>
        {`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.6s ease-out forwards;
          }
        `}
      </style>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in-up">
        <div className="col-span-1 lg:col-span-8 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-blue-400">
                {selectedStory?.title}
              </h1>
            </div>
            <div className="flex justify-start sm:justify-end">
              <div className="flex -space-x-5">
                {stories && stories.length > 0 && (
                  stories.map((story) => (
                    <button
                      key={story.uuid}
                      className={`relative w-16 h-16 rounded-full border-2 ${
                        selectedStory?.uuid === story.uuid
                          ? "border-blue-500 scale-110"
                          : "border-white"
                      } hover:scale-110 transition-transform duration-200 focus:outline-none`}
                      onClick={() => handelStorySelection(story)}
                    >
                      <img
                        src={story.imageURL}
                        alt={story.title}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-50px] left-[-50px] w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3 className="text-xl font-bold text-slate-200 relative z-10">
                Generated Story
              </h3>
              <div className="flex flex-wrap items-center gap-2 relative z-10">
                <button
                  type="button"
                  className="rounded-lg px-4 py-2 bg-slate-700 text-slate-200 font-semibold cursor-pointer hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleCopyStory}
                  disabled={!selectedStory}
                >
                  {isCopied ? "✓ Copied" : "📋 Copy"}
                </button>
                <button
                  type="button"
                  className="rounded-lg px-4 py-2 bg-purple-700 text-slate-200 font-semibold cursor-pointer hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleExportPDF}
                  disabled={!selectedStory}
                >
                  📄 Export PDF
                </button>
                <button
                  type="button"
                  className="rounded-lg px-4 py-2 bg-indigo-700 text-slate-200 font-semibold cursor-pointer hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleExportMarkdown}
                  disabled={!selectedStory}
                >
                  ⬇️ Export Markdown
                </button>
                <button
                  type="button"
                  id="publish-story-btn"
                  className={`rounded-lg px-5 py-2 font-semibold flex items-center space-x-2 cursor-pointer bg-blue-600 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    loading ? "" : "hover:bg-blue-500 hover:shadow-lg active:scale-95"
                  }`}
                  onClick={handelPublishStory}
                  disabled={loading || !selectedStory}
                >
                  {loading ? "Publishing..." : "Publish"}
                </button>
              </div>
            </div>
            <div id="story-content" className="prose prose-invert max-w-none text-slate-300 leading-relaxed tracking-wide relative z-10">
              <p className="break-words">{selectedStory.content}</p>
            </div>
          </div>
          <div className="mt-7">
            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-6 mb-8">
              <h3 className="text-lg font-bold text-slate-200 mb-4">
                Select Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {topics.map((topic, index) => (
                  <span
                    key={index}
                    className={`px-4 py-1.5 ${topic.color} rounded-full text-sm font-medium transition-transform hover:scale-105 cursor-pointer shadow-sm`}
                    onClick={() => handleTopicClick(index)}
                  >
                    {topic.selected ? <i className="fa-solid fa-check"></i> : <i className="fa-solid fa-plus"></i>}{" "}
                    {topic.title}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1 lg:col-span-4">
          <div className="mb-5">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-blue-400">
              Preview
            </h1>
          </div>
          <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden group">
            <div className="relative flex flex-col rounded-lg">
              <div className="relative m-3 overflow-hidden text-white rounded-xl">
                <img
                  src={selectedStory.imageURL}
                  alt="card-image"
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="px-3 py-1">
                <div className="flex justify-between items-center mb-2 w-full">
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center rounded-full bg-purple-600 py-1 px-3 text-xs font-semibold text-white shadow-sm">
                      {selectedStory.tag.toUpperCase()}
                    </div>
                    <div className="inline-flex items-center rounded-full bg-slate-700 py-1 px-2.5 text-xs font-medium text-slate-300 shadow-sm gap-1">
                      ⏱️ {calculateReadingTime(selectedStory.content)} min read
                    </div>
                  </div>
                  <div>
                    <BookmarkButton storyId={selectedStory.uuid} />
                  </div>
                </div>
                <h6 className="mb-1 text-gray-300 text-xl font-semibold">
                  {selectedStory.title}
                </h6>
                <p className="text-gray-400 font-light breakwords text-sm sm:text-base">
                  {getShortenedText(selectedStory.content)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
};

export default StoriesViewComponent;