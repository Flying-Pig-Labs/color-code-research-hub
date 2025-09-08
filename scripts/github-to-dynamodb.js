import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import fetch from "node-fetch";

const GITHUB_API = "https://api.github.com";
const {
  GITHUB_TOKEN,
  AWS_REGION = "us-east-1",
  REPOSITORIES_TABLE = "Repositories",
  BUILD_HISTORY_TABLE = "BuildHistory",
  ISSUES_TABLE = "Issues",
  PRS_TABLE = "PullRequests",
} = process.env;

const ddb = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddb);

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: GITHUB_TOKEN ? `token ${GITHUB_TOKEN}` : undefined,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub request failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function syncRepository(owner, repo) {
  const repoData = await fetchJson(`${GITHUB_API}/repos/${owner}/${repo}`);
  const item = {
    repoId: String(repoData.id),
    name: repoData.name,
    description: repoData.description,
    url: repoData.html_url,
    createdAt: repoData.created_at,
    updatedAt: repoData.updated_at,
    stars: repoData.stargazers_count,
    language: repoData.language,
  };
  await docClient.send(
    new PutCommand({ TableName: REPOSITORIES_TABLE, Item: item })
  );
  return item;
}

export async function syncWorkflowRuns(owner, repo, repoId) {
  const runs = await fetchJson(
    `${GITHUB_API}/repos/${owner}/${repo}/actions/runs?per_page=100`
  );
  if (!Array.isArray(runs.workflow_runs)) return [];
  const promises = runs.workflow_runs.map((run) => {
    const item = {
      buildId: String(run.id),
      repoId: String(repoId || run.repository_id),
      status: run.status,
      startTime: run.run_started_at,
      endTime: run.updated_at,
      logs: run.logs_url,
      artifacts: run.artifacts_url,
    };
    return docClient.send(
      new PutCommand({ TableName: BUILD_HISTORY_TABLE, Item: item })
    );
  });
  await Promise.all(promises);
  return promises.length;
}

export async function syncIssues(owner, repo, repoId) {
  const issues = await fetchJson(
    `${GITHUB_API}/repos/${owner}/${repo}/issues?state=all&per_page=100`
  );
  const filtered = issues.filter((i) => !i.pull_request);
  const promises = filtered.map((issue) => {
    const item = {
      issueId: String(issue.id),
      repoId: String(repoId),
      number: issue.number,
      title: issue.title,
      state: issue.state,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
    };
    return docClient.send(
      new PutCommand({ TableName: ISSUES_TABLE, Item: item })
    );
  });
  await Promise.all(promises);
  return promises.length;
}

export async function syncPullRequests(owner, repo, repoId) {
  const prs = await fetchJson(
    `${GITHUB_API}/repos/${owner}/${repo}/pulls?state=all&per_page=100`
  );
  const promises = prs.map((pr) => {
    const item = {
      prId: String(pr.id),
      repoId: String(repoId),
      number: pr.number,
      title: pr.title,
      state: pr.state,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      mergedAt: pr.merged_at,
    };
    return docClient.send(
      new PutCommand({ TableName: PRS_TABLE, Item: item })
    );
  });
  await Promise.all(promises);
  return promises.length;
}

export async function migrate(owner, repo) {
  const repoItem = await syncRepository(owner, repo);
  const repoId = repoItem.repoId;
  await Promise.all([
    syncWorkflowRuns(owner, repo, repoId),
    syncIssues(owner, repo, repoId),
    syncPullRequests(owner, repo, repoId),
  ]);
  return repoItem;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const [owner, repo] = process.argv.slice(2);
  if (!owner || !repo) {
    console.error("Usage: node scripts/github-to-dynamodb.js <owner> <repo>");
    process.exit(1);
  }
  migrate(owner, repo)
    .then(() => {
      console.log("Migration completed");
    })
    .catch((err) => {
      console.error("Migration failed", err);
      process.exit(1);
    });
}

