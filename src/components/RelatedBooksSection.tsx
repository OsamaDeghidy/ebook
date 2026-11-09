import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Star, Sparkles, ArrowLeft, Radio, HelpCircle } from 'lucide-react';
import { MarketplaceBook } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface RelatedBooksSectionProps {
  currentBook: MarketplaceBook;
  allBooks: MarketplaceBook[];
  onOpenBook: (bookId: string) => void;
}

export const RelatedBooksSection: React.FC<RelatedBooksSectionProps> = ({
  currentBook,
  allBooks,
  onOpenBook
}) => {
  const navigate = useNavigate();
  const { dir, t } = useLanguage();

  // Find 3 to 4 related books based on category, track, or other published books
  const relatedBooks = React.useMemo(() => {
    let matches = allBooks
      .filter(b => b.id !== currentBook.id && (b.is_published !== false))
      .filter(b => {
        if (b.category === currentBook.category) return true;
        if (b.track && currentBook.track && b.track === currentBook.track) return true;
        if (b.subcategory && currentBook.subcategory && b.subcategory === currentBook.subcategory) return true;
        return false;
      });

    if (matches.length < 4) {
      const others = allBooks.filter(b => b.id !== currentBook.id && (b.is_published !== false) && !matches.some(m => m.id === b.id));
      matches = [...matches, ...others];
    }
    return matches.slice(0, 4);
  }, [allBooks, currentBook]);

  if (relatedBooks.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-gray-200/80 space-y-6" dir={dir}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <span>مقررات قد تهمك</span>
            <span className="text-xs font-bold text-slate-500 font-normal hidden sm:inline">مقترحات مختارة لمتابعة دراستك</span>
          </h3>
        </div>
        <button
          onClick={() => navigate('/marketplace')}
          className="text-xs font-black text-teal-600 hover:text-teal-700 flex items-center gap-1 hover:underline cursor-pointer"
        >
          <span>تصفح كل المقررات</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {relatedBooks.map((book) => {
          const priceLabel = book.price ? `${book.price} ج.م` : 'مجاني';
          const isFree = !book.price || book.price === 0;

          return (
            <div
              key={book.id}
              onClick={() => onOpenBook(book.id)}
              className="group bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-indigo-300 transition cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* THUMBNAIL / BADGE */}
                <div className="relative h-32 rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center p-3 text-center">
                  {book.thumbnail_url ? (
                    <img src={book.thumbnail_url} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  ) : (
                    <div className="space-y-1">
                      <BookOpen className="w-8 h-8 text-indigo-400 mx-auto group-hover:scale-110 transition" />
                      <span className="text-[10px] text-indigo-200 line-clamp-1 font-bold">{book.category || 'كتاب رقمي'}</span>
                    </div>
                  )}
                  <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-black ${
                    isFree ? 'bg-emerald-500 text-white shadow-sm' : 'bg-amber-400 text-amber-950 shadow-sm'
                  }`}>
                    {priceLabel}
                  </span>
                </div>

                {/* INFO */}
                <div>
                  <h4 className="font-black text-sm text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition leading-snug">
                    {book.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 line-clamp-1 mt-1 font-medium">
                    {book.author_name || 'خبير المحتوى'}
                  </p>
                </div>
              </div>

              {/* FOOTER */}
              <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-amber-500 font-black text-[11px]">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{book.rating || 5.0}</span>
                </div>
                <span className="text-[11px] font-black text-indigo-600 group-hover:translate-x-[-2px] transition flex items-center gap-1">
                  <span>فتح المقرر</span>
                  <ArrowLeft className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
