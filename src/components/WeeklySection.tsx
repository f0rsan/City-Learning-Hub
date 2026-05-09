import type { Activity } from "../domain/types";
import ActivityCard from "./ActivityCard";

type WeeklySectionProps = {
  title: string;
  subtitle: string;
  activities: Activity[];
};

export default function WeeklySection({ title, subtitle, activities }: WeeklySectionProps) {
  return (
    <section className="weekly-section" aria-labelledby="weekly-title">
      <div className="section-heading">
        <h2 id="weekly-title">{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="activity-grid">
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
    </section>
  );
}
