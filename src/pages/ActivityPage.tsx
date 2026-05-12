import { Navigate, useParams } from "react-router-dom";
import ActivityDetail from "../components/ActivityDetail";
import { getActivityBySlug } from "../domain/activitySelectors";
import { getPublicReadableActivities } from "../domain/candidateStore";

export default function ActivityPage() {
  const { slug } = useParams();
  const activity = slug ? getActivityBySlug(getPublicReadableActivities(), slug) : undefined;

  if (!activity) {
    return <Navigate to="/" replace />;
  }

  return <ActivityDetail activity={activity} />;
}
