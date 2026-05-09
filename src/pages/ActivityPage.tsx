import { Navigate, useParams } from "react-router-dom";
import ActivityDetail from "../components/ActivityDetail";
import { getActivityBySlug } from "../domain/activitySelectors";
import { getCandidateActivities } from "../domain/candidateStore";

export default function ActivityPage() {
  const { slug } = useParams();
  const activity = slug ? getActivityBySlug(getCandidateActivities(), slug) : undefined;

  if (!activity) {
    return <Navigate to="/" replace />;
  }

  return <ActivityDetail activity={activity} />;
}
