import { Navigate, useParams } from "react-router-dom";
import ActivityDetail from "../components/ActivityDetail";
import { getActivityBySlug } from "../domain/activitySelectors";
import { sampleActivities } from "../domain/sampleData";

export default function ActivityPage() {
  const { slug } = useParams();
  const activity = slug ? getActivityBySlug(sampleActivities, slug) : undefined;

  if (!activity) {
    return <Navigate to="/" replace />;
  }

  return <ActivityDetail activity={activity} />;
}
