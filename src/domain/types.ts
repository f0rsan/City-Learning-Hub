export type Audience = "family" | "adult";
export type ActivityStatus = "draft" | "published" | "expired" | "cancelled" | "uncertain";
export type Difficulty = "入门" | "进阶" | "专业";
export type PriceType = "免费" | "收费" | "公益";
export type SourceFamily = "confirmation" | "discovery" | "reputation" | "user";
export type SourceCollectionMode = "auto" | "candidate" | "reputation";
export type SourceAccessMode = "public_web" | "json_api" | "search" | "authorized_import" | "manual_link";
export type SourceComplianceLevel = "auto_allowed" | "needs_review" | "manual_only";
export type SourceConfirmationPower = "strong" | "supporting" | "none";

export type ActivitySource = {
  id: string;
  name: string;
  type:
    | "venue"
    | "university"
    | "bookstore"
    | "tech-park"
    | "community"
    | "conference-platform"
    | "organizer"
    | "listing-platform";
  url: string;
  trustLevel: "high" | "medium" | "unverified";
  signalWeight?: number;
  lastChecked: string;
  sourceFamily?: SourceFamily;
  collectionMode?: SourceCollectionMode;
  accessMode?: SourceAccessMode;
  coverageTags?: string[];
  complianceLevel?: SourceComplianceLevel;
  confirmationPower?: SourceConfirmationPower;
};

export type Activity = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: "电子展会" | "游戏展会" | "科技展会" | "技术大会" | "社科讲座" | "读书沙龙" | "Hackathon" | "亲子科技";
  audience: Audience[];
  tags: string[];
  district: "南山" | "福田" | "宝安" | "龙岗" | "罗湖" | "盐田" | "光明";
  venue: string;
  address: string;
  startAt: string;
  endAt: string;
  dateNote?: string;
  priceType: PriceType;
  priceNote: string;
  reservationRequired: boolean;
  ageBand?: string;
  difficulty: Difficulty;
  recommendation: string;
  bestFor: string;
  cautions: string[];
  officialUrl: string;
  sourceId: string;
  lastConfirmedAt: string;
  status: ActivityStatus;
  weeklyFeatured: boolean;
  childSafetyComplete: boolean;
  evaluation?: import("./evaluationTypes").ActivityEvaluation;
};

export type ActivityCoverImage = {
  src: string;
  alt: string;
  sourceName: string;
};

export type TrustState = {
  level: "clear" | "warning" | "blocked";
  label: string;
  message: string;
};

export type SubmittedActivityStatus = "pending" | "approved" | "rejected";

export type SubmittedActivityInput = {
  title: string;
  category: Activity["category"];
  audience: Audience[];
  dateText: string;
  district: string;
  venue: string;
  officialUrl: string;
  contact: string;
  note: string;
};

export type SubmittedActivity = SubmittedActivityInput & {
  id: string;
  status: SubmittedActivityStatus;
  createdAt: string;
};

export type CorrectionReportStatus = "open" | "resolved";

export type CorrectionReportInput = {
  activitySlug: string;
  issueType: string;
  detail: string;
  contact: string;
};

export type CorrectionReport = CorrectionReportInput & {
  id: string;
  status: CorrectionReportStatus;
  createdAt: string;
  resolvedAt?: string;
};
