export type UserRole = 'admin' | 'instructor' | 'student';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  avatar_url?: string;
  created_at?: string;
}

export type BookCategory = 
  | 'all'
  | 'academic_curriculum' 
  | 'quiz_bank' 
  | 'training_packages' 
  | 'programming_ai' 
  | 'self_help' 
  | 'languages_translation' 
  | 'literature_novels' 
  | 'medicine_health' 
  | 'law_political_science' 
  | 'business_marketing'
  // Legacy / aliases compatibility
  | 'digital_book' 
  | 'training_kit' 
  | 'academic_paper' 
  | 'business' 
  | 'technology' 
  | 'classics';

export type EducationLevel = 'pre_university' | 'university';

export type AcademicSystem = 
  | 'general_arabic' 
  | 'general_languages' 
  | 'international_american' 
  | 'international_british' 
  | 'international_french' 
  | 'technical';

export type BookTrack = 
  | 'academic' 
  | 'self_help' 
  | 'business_finance' 
  | 'programming_tech' 
  | 'science_math' 
  | 'languages' 
  | 'general_literature';

export type QuestionType = 'mcq' | 'true_false' | 'essay' | 'worked_example' | 'fill_blank' | 'case_study';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  questionType?: QuestionType;
  difficulty?: 'easy' | 'medium' | 'hard';
  topicTag?: string;
  cognitiveLevel?: string; // Bloom's Taxonomy: تذكر | فهم واستيعاب | تطبيق وحل مسائل | تحليل واستنتاج
  trapWarning?: string; // High-order exam trap and misconception warning
  points?: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  chapterTitle?: string;
  hint?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  lastReviewed?: string;
  intervalDays?: number;
}

export interface VideoLink {
  id: string;
  title: string;
  url: string;
  description: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  parentId: string | null;
  description?: string;
  category?: string;
}

export interface CurriculumMindMapNode {
  id: string;
  label: string;
  parentId: string | null;
  chapterTitle?: string;
  chapterIndex?: number;
  level?: 'root' | 'chapter' | 'concept' | 'subtopic';
  description: string;
  keyTakeaway?: string;
  category?: string;
  color?: string;
}

export interface CurriculumLearningMilestone {
  step: number;
  title: string;
  focus: string;
  keyConcepts: string[];
}

export interface CurriculumMindMapPayload {
  title: string;
  courseTitle: string;
  totalChapters: number;
  summary: string;
  mermaidSyntax: string;
  nodes: CurriculumMindMapNode[];
  learningPath: CurriculumLearningMilestone[];
  generatedAt: string;
}

export interface Chapter {
  id: string;
  title: string;
  content: string; // Markdown text (fallback)
  originalContent?: string; // Original parsed text from the document
  summary?: string; // Chapter summary
  concepts?: { concept: string; explanation: string }[]; // Concepts and their explanations
  imageUrl?: string; // Generated visual base64 or URL
  imagePrompt?: string; // Prompt used to generate visual
  audioBase64?: string; // Narrator audio tracking
  audioUrl?: string; // Supabase CDN audio URL
  podcastAudioUrl?: string; // Supabase CDN podcast episode URL
  videos: VideoLink[];
  quiz: QuizQuestion[];
  flashcards?: Flashcard[];
  mindMap: MindMapNode[];
  interactive_explanation?: any; // V2 interactive lesson explanation
  examTraps?: any[];
  questions?: any[];
  learningObjectives?: any[];
}

export interface FeatureToggles {
  show_podcast?: boolean;
  show_flashcards?: boolean;
  show_sandbox?: boolean;
  show_quiz?: boolean;
  show_mindmap?: boolean;
  show_videos?: boolean;
}

export interface Ebook {
  id: string;
  title: string;
  description: string;
  author_id?: string;
  author_name?: string;
  category?: BookCategory;
  track?: BookTrack;
  education_level?: string;
  academic_system?: string;
  subcategory?: string;
  grade_level?: string;
  semester?: string;
  academic_year?: string;
  source_file_name?: string;
  tags?: string[];
  price?: number; // 0 = Free
  is_external?: boolean;
  external_url?: string;
  preview_video_url?: string; // Explanatory demo video URL
  sales_count?: number;
  is_published?: boolean;
  approval_status?: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'edit_requested';
  admin_rejection_reason?: string;
  edit_request_notes?: string;
  thumbnail_url?: string;
  rating?: number;
  reviews_count?: number;
  sizeCategory?: 'short' | 'medium' | 'long';
  createdAt?: string;
  created_at?: string;
  chapters: Chapter[];
  mind_map?: MindMapNode[];
  question_bank?: QuizQuestion[];
  flashcards?: Flashcard[];
  feature_toggles?: FeatureToggles;
  pregeneration_status?: 'idle' | 'processing' | 'ready';
  pregeneration_percent?: number;
  curriculum_explanation?: any;
  curriculum_mindmap?: CurriculumMindMapPayload;
  language?: 'ar' | 'en' | 'it' | 'fr' | 'de' | string;
  is_language_learning?: boolean;
  target_learning_language?: 'ar' | 'en' | 'it' | 'fr' | 'de' | string;
  exams?: any[];
}

export interface MarketplaceBook extends Ebook {
  id: string;
  title: string;
  description: string;
  author_id?: string;
  author_name: string;
  category: BookCategory;
  track?: BookTrack;
  education_level?: string;
  academic_system?: string;
  subcategory?: string;
  grade_level?: string;
  semester?: string;
  academic_year?: string;
  source_file_name?: string;
  tags: string[];
  price: number;
  is_external: boolean;
  external_url?: string;
  preview_video_url?: string;
  sales_count?: number;
  is_published: boolean;
  approval_status?: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'edit_requested';
  admin_rejection_reason?: string;
  edit_request_notes?: string;
  thumbnail_url: string;
  rating: number;
  reviews_count: number;
  feature_toggles?: FeatureToggles;
  pregeneration_status?: 'idle' | 'processing' | 'ready';
  pregeneration_percent?: number;
  curriculum_explanation?: any;
  curriculum_mindmap?: CurriculumMindMapPayload;
  language?: 'ar' | 'en' | 'it' | 'fr' | 'de' | string;
  is_language_learning?: boolean;
  target_learning_language?: 'ar' | 'en' | 'it' | 'fr' | 'de' | string;
  stage?: string;
  coverUrl?: string;
  isCurriculum?: boolean;
  gradeLevel?: string;
  educationStage?: string;
  author?: string;
  is_free?: boolean;
}

export interface ConversionJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progressPercent: number;
  progressStep: string;
  resultEbook?: Ebook;
  error?: string;
  createdAt: string;
}

export type EduReelStyle = 'cyberpunk' | 'chalkboard' | 'cinematic' | 'gamified';

export interface EduReelWordTiming {
  word: string;
  startMs: number;
  endMs: number;
}

export interface EduReelVisualCard {
  title: string;
  content: string;
  type: 'formula' | 'code' | 'lore' | 'diagram' | 'quote';
  startSec: number;
  endSec: number;
}

export interface EduReelInteractiveQuiz {
  question: string;
  options: string[];
  correctIndex: number;
  triggerSec: number;
  explanation: string;
}

export interface EduReelScene {
  id: string;
  act: 'hook' | 'concept' | 'takeaway';
  title: string;
  subtitle?: string;
  badgeText: string;
  visualType: 'illustration' | 'code' | 'formula' | 'diagram' | 'quote' | 'bullet_points';
  visualData?: {
    codeSnippet?: string;
    language?: string;
    formulaLatex?: string;
    bullets?: string[];
    highlightQuote?: string;
    imageUrl?: string;
    imagePrompt?: string;
  };
  duration?: number;
  script?: string;
  startSec: number;
  endSec: number;
}

export interface EduReel {
  id: string;
  title?: string;
  book_id: string;
  book_title?: string;
  author_name?: string;
  category?: BookCategory;
  subcategory?: string;
  thumbnail_url?: string;
  chapter_id: string;
  chapter_title: string;
  style_type: EduReelStyle;
  style?: EduReelStyle;
  voice?: string;
  duration_seconds: number;
  audio_url?: string;
  ambient_music_url?: string;
  narration_script: string;
  scenes?: EduReelScene[];
  word_timings: EduReelWordTiming[];
  visual_cards: EduReelVisualCard[];
  interactive_quiz?: EduReelInteractiveQuiz;
  quickQuiz?: any;
  stats?: any;
  likes_count: number;
  views_count: number;
  completions_count: number;
  is_public_teaser?: boolean;
  created_at?: string;
}

export interface StudentTelemetryPayload {
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  bookId: string;
  bookTitle?: string;
  chapterId: string;
  chapterTitle?: string;
  activeReadingSeconds: number;
  audioListenPercentage: number;
  quizScore?: number;
  quizAttempts?: {
    questionIndex: number;
    selectedOption: number;
    isCorrect: boolean;
    trapTriggered?: boolean;
  }[];
  isCompleted?: boolean;
  timestamp?: string;
}

export interface TeacherTicket {
  id: string;
  bookId: string;
  bookTitle: string;
  chapterId: string;
  chapterTitle: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  selectedSnippet?: string;
  questionText: string;
  status: 'pending' | 'answered';
  teacherAnswer?: string;
  teacherAudioUrl?: string;
  createdAt: string;
  answeredAt?: string;
}

export interface InstructorCockpitAnalytics {
  totalLearners: number;
  activeLearnersCount: number;
  avgReadingMinutes: number;
  avgAudioListenPercent: number;
  studentsAtRisk: {
    studentId: string;
    studentName: string;
    bookTitle: string;
    avgScore: number;
    lastActive: string;
    riskFactor: string;
  }[];
  curriculumBottlenecks: {
    chapterTitle: string;
    questionIndex: number;
    failRate: number;
    trapDescription: string;
  }[];
  studentLogs: {
    studentId: string;
    studentName: string;
    bookTitle: string;
    totalMinutes: number;
    chaptersCompleted: number;
    quizAccuracy: number;
    lastActive: string;
  }[];
}

export interface InstructorWallet {
  totalEarnings: number;
  availableBalance: number;
  pendingPayouts: number;
  platformFeePercent: number;
  transactions: {
    id: string;
    amount: number;
    type: 'sale' | 'payout' | 'fee';
    description: string;
    date: string;
    status: 'completed' | 'pending' | 'rejected';
  }[];
}

