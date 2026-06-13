"use client";

import { signIn } from "next-auth/react";
import { Brand } from "@/components/ui";

interface Props {
  callbackUrl: string;
  hasGoogle: boolean;
  error?: string;
}

export function SignInForm({ callbackUrl, hasGoogle, error }: Props) {
  const onGoogle = () => {
    void signIn("google", { callbackUrl });
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <Brand size={44} />
        <h1>Cùng Khỉ con vào lớp 6 CLC</h1>
        <p className="sub">
          Luyện đề · Đánh giá lộ trình · Học cùng AI
          <br />
          Dành cho học sinh lớp 5 thi vào trường chất lượng cao
        </p>

        {error && (
          <div
            style={{
              background: "var(--danger-soft)",
              color: "var(--danger)",
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 16,
              textAlign: "left",
            }}
          >
            Đăng nhập chưa thành công. Hãy thử lại.
          </div>
        )}

        {hasGoogle ? (
          <button className="google-btn" onClick={onGoogle}>
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 009 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.97 10.72A5.41 5.41 0 013.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.97 8.97 0 009 0 9 9 0 00.96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
              />
            </svg>
            Đăng nhập với Google
          </button>
        ) : (
          <p
            style={{
              background: "var(--warn-soft, var(--surface-2))",
              color: "var(--ink)",
              padding: "12px 14px",
              borderRadius: 8,
              fontSize: 13,
              textAlign: "left",
            }}
          >
            Đăng nhập với Google chưa được cấu hình. Vui lòng liên hệ quản trị viên.
          </p>
        )}

        <p className="auth-foot">
          Khi đăng nhập, bạn đồng ý với Điều khoản &amp; Chính sách bảo mật của ứng dụng.
        </p>
      </div>
    </div>
  );
}
