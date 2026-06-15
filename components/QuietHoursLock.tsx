import Link from "next/link";
import { Icon } from "./Icon";

interface Props {
  start: string;
  end: string;
}

export function QuietHoursLock({ start, end }: Props) {
  return (
    <div
      className="main"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: "100%",
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "32px 28px",
          boxShadow: "var(--shadow)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "var(--bg-subtle)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
          aria-hidden
        >
          <Icon name="clock" size={36} />
        </div>
        <h2 style={{ margin: "0 0 8px", fontSize: 22 }}>Đến giờ nghỉ rồi nhé!</h2>
        <p style={{ margin: "0 0 16px", color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>
          Để bảo vệ sức khoẻ và giấc ngủ của các con, hệ thống tạm khoá truy cập trong khung giờ:
        </p>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "var(--bg-subtle)",
            borderRadius: 10,
            padding: "10px 18px",
            fontFamily: "var(--mono)",
            fontSize: 20,
            margin: "0 0 16px",
          }}
        >
          <b>
            {start} – {end}
          </b>
          <span style={{ color: "var(--muted)", fontSize: 12 }}>(GMT+7)</span>
        </div>
        <p style={{ margin: "0 0 20px", color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>
          Hẹn các con quay lại sau <b>{end}</b> sáng. Chúc các con một giấc ngủ ngon!
        </p>
        <Link href="/guide" className="btn">
          <Icon name="book" /> Xem hướng dẫn &amp; lý do
        </Link>
      </div>
    </div>
  );
}
