import { ArrowRight, Baby, Users } from "lucide-react";
import { Link } from "react-router-dom";

type AudienceEntryProps = {
  type: "family" | "adult";
};

export default function AudienceEntry({ type }: AudienceEntryProps) {
  const isFamily = type === "family";
  return (
    <Link className="audience-entry" to={`/audience/${type}`}>
      {isFamily ? <Baby aria-hidden="true" /> : <Users aria-hidden="true" />}
      <span>
        <strong>{isFamily ? "带孩子去学习" : "成人学习交流"}</strong>
        <small>
          {isFamily ? "适合年龄、体验亮点、预约和陪同要求" : "技术、社科、读书和创业活动"}
        </small>
      </span>
      <ArrowRight aria-hidden="true" />
    </Link>
  );
}
