import { CalendarDays, ClipboardPlus, MapPinned, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { applyThemeMode, getInitialThemeMode, persistThemeMode } from "../domain/theme";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const [themeMode, setThemeMode] = useState(getInitialThemeMode);

  useEffect(() => {
    applyThemeMode(themeMode);
    persistThemeMode(themeMode);
  }, [themeMode]);

  const themeLabel = themeMode === "dark" ? "切换浅色模式" : "切换深色模式";

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>
      <header className="site-header">
        <Link className="brand" to="/">
          深圳学习 Hub
        </Link>
        <nav aria-label="主导航">
          <NavLink to="/" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            本周精选
          </NavLink>
          <NavLink to="/audience/family" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            亲子
          </NavLink>
          <NavLink to="/audience/adult" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            成人
          </NavLink>
          <NavLink to="/submit" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            <ClipboardPlus size={18} aria-hidden="true" />
            提交活动
          </NavLink>
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setThemeMode((current) => (current === "dark" ? "light" : "dark"))}
            aria-label={themeLabel}
            title={themeLabel}
          >
            {themeMode === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>
        </nav>
      </header>
      <div id="main-content">{children}</div>
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
