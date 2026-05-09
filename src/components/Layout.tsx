import { CalendarDays, ClipboardPlus, MapPinned } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="site-shell">
      <header className="site-header">
        <Link className="brand" to="/">
          深圳学习 Hub
        </Link>
        <nav aria-label="主导航">
          <Link to="/">本周精选</Link>
          <Link to="/audience/family">亲子</Link>
          <Link to="/audience/adult">成人</Link>
          <Link to="/submit">
            <ClipboardPlus size={18} aria-hidden="true" />
            提交活动
          </Link>
        </nav>
      </header>
      {children}
      <footer className="site-footer">
        <Link to="/about">来源说明</Link>
        <span>
          <CalendarDays size={16} aria-hidden="true" />
          每周更新
        </span>
        <span>
          <MapPinned size={16} aria-hidden="true" />
          深圳单城市
        </span>
      </footer>
    </div>
  );
}
