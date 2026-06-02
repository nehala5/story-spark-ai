import { FC } from "react";
import HelpCategoryCard from "../help_category_card/help_category_card.component";
import { motion } from "framer-motion";
import { HelpCategory } from "../help_center.utils";

interface HelpCategoriesProps {
  categories: HelpCategory[];
}

const HelpCategories: FC<HelpCategoriesProps> = ({ categories }) => {
  return (
    <motion.section
      id="help-categories"
      className="scroll-mt-28 transition-colors duration-300"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      aria-labelledby="categories-heading"
    >
      <div className="mb-12 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-300 mb-4 font-semibold tracking-wider text-xs">
          <i className="fa-solid fa-layer-group" aria-hidden="true"></i>
          <span>HELP CATEGORIES</span>
        </div>

        <h2 id="categories-heading" className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
          Explore by Category
        </h2>

        <p className="text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          Browse support topics designed to help you quickly understand StorySparkAI features, workflows, and troubleshooting steps.
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-[2.5rem] border border-dashed border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/[0.03] p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mx-auto mb-5">
            <i className="fa-solid fa-magnifying-glass text-3xl text-slate-500"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Categories Found</h3>
          <p className="text-slate-600 dark:text-gray-400">Try adjusting your search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
          {categories.map((category) => (
            <HelpCategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </motion.section>
  );
};

export default HelpCategories;
