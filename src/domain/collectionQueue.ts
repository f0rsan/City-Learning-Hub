import { createCollectedCandidate } from "./candidateStore";
import { createId, readList, writeList } from "./localStore";
import { getSourcePool, recordSourceFailure as recordSourceRuntimeFailure, recordSourceSuccess } from "./sourcePool";

export type CollectionFailure = {
  sourceId: string;
  reason: string;
};

export type CollectionRun = {
  id: string;
  createdAt: string;
  createdCandidateIds: string[];
  failures: CollectionFailure[];
};

const collectionRunsKey = "shenzhen-learning-hub:collection-runs";

function writeRun(run: CollectionRun) {
  writeList(collectionRunsKey, [run, ...getCollectionRuns()]);
  return run;
}

export function getCollectionRuns() {
  return readList<CollectionRun>(collectionRunsKey);
}

export function runSimulatedCollection() {
  const sources = getSourcePool().filter((source) => source.health !== "failing");
  const createdCandidateIds = sources.slice(0, 2).map((source, index) => {
    const candidate = createCollectedCandidate({
      title: `自动采集候选：${source.name}${index + 1}`,
      category: index === 0 ? "科技展会" : "读书沙龙",
      audience: index === 0 ? ["adult"] : ["family", "adult"],
      sourceId: source.id,
      officialUrl: `${source.url}/auto-candidate-${index + 1}`
    });
    recordSourceSuccess(source.id);

    return candidate.id;
  });

  return writeRun({
    id: createId("collection"),
    createdAt: new Date().toISOString(),
    createdCandidateIds,
    failures: []
  });
}

export function recordSourceFailure(sourceId: string, reason: string) {
  recordSourceRuntimeFailure(sourceId, reason);

  return writeRun({
    id: createId("collection"),
    createdAt: new Date().toISOString(),
    createdCandidateIds: [],
    failures: [{ sourceId, reason }]
  });
}

export function replaceCollectionRuns(runs: CollectionRun[]) {
  writeList(collectionRunsKey, runs);
}

export function resetCollectionRuns() {
  window.localStorage.removeItem(collectionRunsKey);
}
