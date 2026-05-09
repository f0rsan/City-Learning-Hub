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
        <strong>{isFamily ? "带孩子去学习" : "大人去交流"}</strong>
        <small>
          {isFamily ? "适龄、体验价值、预约门槛和陪同要求" : "科技、读书、社科、创业和技术交流"}
        </small>
      </span>
      <ArrowRight aria-hidden="true" />
    </Link>
  );
}
