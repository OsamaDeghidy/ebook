import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Mail, Lock, User, Shield, AlertCircle, Sparkles, GraduationCap, Check } from 'lucide-react';
import { UserRole } from '../types';
import { TermsOfUseModal } from './legal/TermsOfUseModal';
import { getPlatformConfig, PlatformConfig } from '../services/platformConfigService';
import { useLanguage } from '../i18n/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any, role: UserRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t, language, dir } = useLanguage();
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(getPlatformConfig());

  useEffect(() => {
    const handleConfigChange = (e: any) => {
      setPlatformConfig(e.detail || getPlatformConfig());
    };
    window.addEventListener('platform-config-changed', handleConfigChange);
    return () => window.removeEventListener('platform-config-changed', handleConfigChange);
  }, []);

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: selectedRole
            }
          }
        });

        if (signUpError) {
          throw new Error(signUpError.message || 'فشل إنشاء الحساب، يرجى المحاولة مرة أخرى.');
        }

        if (data.user) {
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              email: email,
              full_name: fullName || email.split('@')[0],
              role: selectedRole
            });
          } catch (e) {
            console.warn('Profile upsert notice:', e);
          }

          localStorage.setItem('osera_auth_role', selectedRole);
          localStorage.setItem('osera_auth_user', JSON.stringify(data.user));
          localStorage.setItem('simplest_auth_role', selectedRole);
          localStorage.setItem('simplest_auth_user', JSON.stringify(data.user));
          onSuccess(data.user, selectedRole);
          onClose();
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          throw new Error('بيانات تسجيل الدخول غير صحيحة. يرجى التأكد من البريد الإلكتروني وكلمة المرور أو إنشاء حساب جديد.');
        }

        if (data.user) {
          let userRole: UserRole = 'student';
          
          try {
            // Read strictly from Supabase profiles table
            const { data: profile } = await supabase
              .from('profiles')
              .select('role, full_name')
              .eq('id', data.user.id)
              .maybeSingle();

            if (profile && profile.role) {
              userRole = profile.role as UserRole;
            } else {
              // Profile not in database yet: initialize it with user metadata or fallback
              const metaRole = (data.user.user_metadata?.role as UserRole) || selectedRole || 'student';
              userRole = metaRole;

              await supabase.from('profiles').upsert({
                id: data.user.id,
                email: email,
                full_name: data.user.user_metadata?.full_name || email.split('@')[0],
                role: userRole
              });
            }
          } catch (e) {
            console.warn('Profile sync notice:', e);
          }

          localStorage.setItem('osera_auth_role', userRole);
          localStorage.setItem('osera_auth_user', JSON.stringify(data.user));
          localStorage.setItem('simplest_auth_role', userRole);
          localStorage.setItem('simplest_auth_user', JSON.stringify(data.user));
          onSuccess(data.user, userRole);
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء المصادقة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-fade-in text-start" dir={dir}>
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-center mx-auto text-teal-600 font-black text-2xl shadow-sm">
            {platformConfig.brandName ? platformConfig.brandName.charAt(0) : '⚡'}
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            {isSignUp ? `إنشاء حساب جديد في ${platformConfig.brandName}` : `تسجيل الدخول إلى ${platformConfig.brandName}`}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {platformConfig.brandSubtitle || 'منظومة التعليم التفاعلي وإدارة المقررات الذكية'}
          </p>
        </div>

        {/* 🌟 ROLE SELECTION TABS (Sign Up Only) */}
        {isSignUp && (
          <div className="space-y-2 mb-6">
            <label className="block text-xs font-bold text-slate-700">حدد نوع الحساب:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('student')}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  selectedRole === 'student'
                    ? 'bg-teal-50 border-teal-500 text-teal-950 shadow-2xs font-black'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-teal-600" />
                <span>🎓 حساب طالب</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('instructor')}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  selectedRole === 'instructor'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-2xs font-black'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <User className="w-4 h-4 text-indigo-600" />
                <span>👨‍🏫 حساب معلّم / محاضر</span>
              </button>
            </div>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* AUTH FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: د. كريم كامل / الطالب أحمد"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
            />
          </div>

          {isSignUp && (
            <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-600">
              <input
                type="checkbox"
                required
                id="terms_agree"
                className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
              <label htmlFor="terms_agree" className="cursor-pointer leading-tight">
                أوافق على{' '}
                <button
                  type="button"
                  onClick={() => setIsTermsOpen(true)}
                  className="text-sky-600 hover:text-sky-700 underline font-bold"
                >
                  شروط الاستخدام وسياسة الملكية الفكرية
                </button>{' '}
                وإخلاء المسؤولية القانونية للمنصة.
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'جاري التحقق...' : (isSignUp ? 'إنشاء الحساب وتفعيل الصلاحية' : 'تسجيل الدخول')}
          </button>
        </form>

        <TermsOfUseModal
          isOpen={isTermsOpen}
          onClose={() => setIsTermsOpen(false)}
        />

        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs font-bold text-teal-600 hover:underline cursor-pointer"
          >
            {isSignUp ? 'لديك حساب بالفعل؟ سجل دخولك' : 'ليس لديك حساب؟ أنشئ حساباً جديداً'}
          </button>
        </div>
      </div>
    </div>
  );
};
