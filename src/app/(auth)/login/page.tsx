"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  useEffect(() => {
    // 인앱 브라우저 감지
    const ua = navigator.userAgent || navigator.vendor;
    const isInApp =
      /KAKAOTALK/i.test(ua) ||
      /NAVER/i.test(ua) ||
      /Instagram/i.test(ua) ||
      /FBAN|FBAV/i.test(ua) || // Facebook
      /Line/i.test(ua) ||
      /wv\)/i.test(ua) || // Android WebView
      /WebView/i.test(ua);

    setIsInAppBrowser(isInApp);
  }, []);

  const handleGoogleLogin = () => {
    if (isInAppBrowser) {
      return; // 인앱 브라우저에서는 로그인 차단
    }
    signIn("google", { callbackUrl: "/" });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = window.location.origin;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl shadow-lg shadow-orange-500/30 mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Running Crew</h1>
          <p className="text-slate-400">함께 달리고, 함께 성장하세요</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">
            로그인
          </h2>

          {/* 인앱 브라우저 경고 */}
          {isInAppBrowser ? (
            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <p className="text-yellow-400 font-medium text-sm mb-2">
                  외부 브라우저에서 열어주세요
                </p>
                <p className="text-slate-400 text-xs leading-relaxed">
                  카카오톡, 인스타그램 등의 인앱 브라우저에서는 Google 로그인이 제한됩니다.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-slate-300 text-sm text-center">
                  아래 방법 중 하나를 선택하세요:
                </p>

                {/* 링크 복사 버튼 */}
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200"
                >
                  {showCopySuccess ? (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      복사됨!
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      링크 복사하기
                    </>
                  )}
                </button>

                <p className="text-slate-500 text-xs text-center">
                  복사한 링크를 Chrome 또는 Safari에 붙여넣기 하세요
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-800/50 text-slate-500">또는</span>
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-xl p-4">
                <p className="text-slate-300 text-sm font-medium mb-2">
                  우측 상단 메뉴에서:
                </p>
                <ul className="text-slate-400 text-xs space-y-1">
                  <li>• 카카오톡: ⋮ → 다른 브라우저로 열기</li>
                  <li>• 인스타그램: ⋮ → 브라우저에서 열기</li>
                  <li>• 기타: 외부 브라우저로 열기</li>
                </ul>
              </div>
            </div>
          ) : (
            <>
              {/* Google Login */}
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-medium py-3 px-4 rounded-xl transition-all duration-200 hover:shadow-lg"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google로 계속하기
              </button>

              {/* Footer */}
              <p className="text-center text-slate-400 text-sm mt-6">
                Google 계정으로 간편하게 시작하세요
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
