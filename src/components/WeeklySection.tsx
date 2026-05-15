import { useEffect, useMemo, useState } from "react";
import type { Activity } from "../domain/types";
import ActivityCard from "./ActivityCard";

type WeeklySectionProps = {
  title: string;
  subtitle: string;
  activities: Activity[];
};

export default function WeeklySection({ title, subtitle, activities }: WeeklySectionProps) {
  const [isCompactViewport, setIsCompactViewport] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }

    return window.matchMedia("(max-width: 860px)").matches;
  });
  const [showAll, setShowAll] = useState(false);
  const visibleActivities = useMemo(() => {
    if (!isCompactViewport || showAll) {
      return activities;
    }

    return activities.slice(0, 6);
  }, [activities, isCompactViewport, showAll]);
  const remainingCount = Math.max(0, activities.length - visibleActivities.length);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 860px)");
    const syncViewport = () => setIsCompactViewport(mediaQuery.matches);

    syncViewport();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncViewport);
      return () => mediaQuery.removeEventListener("change", syncViewport);
    }

    mediaQuery.addListener(syncViewport);
    return () => mediaQuery.removeListener(syncViewport);
  }, []);

  useEffect(() => {
    if (!isCompactViewport) {
      setShowAll(true);
      return;
    }

    setShowAll(false);
  }, [isCompactViewport]);

  return (
    <section className="weekly-section" aria-labelledby="weekly-title">
      <div className="section-heading">
        <h2 id="weekly-title">{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="activity-grid">
        {visibleActivities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
      {isCompactViewport && remainingCount > 0 ? (
        <div className="section-actions">
          <button type="button" onClick={() => setShowAll(true)}>
            展开其余 {remainingCount} 条活动
          </button>
        </div>
      ) : null}
    </section>
  );
}
